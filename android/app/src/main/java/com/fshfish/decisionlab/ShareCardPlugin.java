package com.fshfish.decisionlab;

import android.Manifest;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.Comparator;
import java.util.TimeZone;

@CapacitorPlugin(
    name = "ShareCard",
    permissions = @Permission(alias = "legacyStorage", strings = Manifest.permission.WRITE_EXTERNAL_STORAGE)
)
public final class ShareCardPlugin extends Plugin {

    private static final String MIME_TYPE = "image/png";
    private static final String ALBUM_DIRECTORY = "Decision Lab";
    private static final String SHARE_CACHE_DIRECTORY = "share";
    private static final long CACHE_MAX_AGE_MS = 24L * 60L * 60L * 1000L;
    private static final int MAX_CACHED_FILES = 5;

    @PluginMethod
    public void saveImage(PluginCall call) {
        final byte[] png;
        try {
            png = decodeCall(call);
        } catch (ShareCardPayload.ShareCardPayloadException error) {
            call.reject(error.getMessage(), error.getCode(), error);
            return;
        }

        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P && getPermissionState("legacyStorage") != PermissionState.GRANTED) {
            requestPermissionForAlias("legacyStorage", call, "legacyStoragePermissionCallback");
            return;
        }

        saveDecodedImage(call, png);
    }

    @PermissionCallback
    private void legacyStoragePermissionCallback(PluginCall call) {
        if (getPermissionState("legacyStorage") != PermissionState.GRANTED) {
            call.reject("Legacy picture storage permission was denied", "PERMISSION_DENIED");
            return;
        }
        saveImage(call);
    }

    @PluginMethod
    public void shareImage(PluginCall call) {
        final byte[] png;
        try {
            png = decodeCall(call);
        } catch (ShareCardPayload.ShareCardPayloadException error) {
            call.reject(error.getMessage(), error.getCode(), error);
            return;
        }

        final File shareFile;
        try {
            File shareDirectory = new File(getContext().getCacheDir(), SHARE_CACHE_DIRECTORY);
            if (!shareDirectory.exists() && !shareDirectory.mkdirs()) {
                throw new IOException("Unable to create share cache directory");
            }
            cleanupShareCache(shareDirectory);
            shareFile = uniqueFile(shareDirectory, System.currentTimeMillis());
            try (OutputStream output = new FileOutputStream(shareFile)) {
                output.write(png);
                output.flush();
            }
        } catch (IOException error) {
            call.reject("Unable to cache the share card", "SHARE_FAILED", error);
            return;
        }

        final Uri contentUri;
        try {
            contentUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                shareFile
            );
        } catch (IllegalArgumentException error) {
            deleteQuietly(shareFile);
            call.reject("Unable to expose the share card", "SHARE_FAILED", error);
            return;
        }

        Intent sendIntent = new Intent(Intent.ACTION_SEND);
        sendIntent.setType(MIME_TYPE);
        sendIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
        sendIntent.setClipData(ClipData.newRawUri("Decision Lab result card", contentUri));
        sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        PackageManager packageManager = getContext().getPackageManager();
        if (sendIntent.resolveActivity(packageManager) == null) {
            deleteQuietly(shareFile);
            call.reject("No application can share PNG images", "NO_SHARE_TARGET");
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                Intent chooser = Intent.createChooser(sendIntent, "分享 Decision Lab 结果卡");
                getActivity().startActivity(chooser);
                JSObject response = new JSObject();
                response.put("chooserOpened", true);
                call.resolve(response);
            } catch (RuntimeException error) {
                deleteQuietly(shareFile);
                call.reject("Unable to open the system share sheet", "SHARE_FAILED", error);
            }
        });
    }

    private byte[] decodeCall(PluginCall call) throws ShareCardPayload.ShareCardPayloadException {
        return ShareCardPayload.decodePng(call.getString("base64"));
    }

    private void saveDecodedImage(PluginCall call, byte[] png) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            saveWithMediaStore(call, png);
        } else {
            saveWithLegacyPictures(call, png);
        }
    }

    private void saveWithMediaStore(PluginCall call, byte[] png) {
        String fileName = ShareCardPayload.createFileName(System.currentTimeMillis(), TimeZone.getDefault());
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
        values.put(MediaStore.Images.Media.MIME_TYPE, MIME_TYPE);
        values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/" + ALBUM_DIRECTORY);
        values.put(MediaStore.Images.Media.IS_PENDING, 1);

        Uri uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
        if (uri == null) {
            call.reject("MediaStore did not create an image row", "SAVE_FAILED");
            return;
        }

        try {
            try (OutputStream output = resolver.openOutputStream(uri, "w")) {
                if (output == null) throw new IOException("MediaStore did not provide an output stream");
                output.write(png);
                output.flush();
            }
            ContentValues completed = new ContentValues();
            completed.put(MediaStore.Images.Media.IS_PENDING, 0);
            if (resolver.update(uri, completed, null, null) < 1) {
                throw new IOException("Unable to publish the MediaStore row");
            }
            resolveSaved(call, uri.toString(), fileName);
        } catch (IOException | RuntimeException error) {
            resolver.delete(uri, null, null);
            call.reject("Unable to save the PNG to MediaStore", "SAVE_FAILED", error);
        }
    }

    @SuppressWarnings("deprecation")
    private void saveWithLegacyPictures(PluginCall call, byte[] png) {
        File pictures = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
        File album = new File(pictures, ALBUM_DIRECTORY);
        if (!album.exists() && !album.mkdirs()) {
            call.reject("Unable to create the Decision Lab picture directory", "SAVE_FAILED");
            return;
        }

        File target = uniqueFile(album, System.currentTimeMillis());
        try (OutputStream output = new FileOutputStream(target)) {
            output.write(png);
            output.flush();
        } catch (IOException error) {
            deleteQuietly(target);
            call.reject("Unable to save the PNG to public Pictures", "SAVE_FAILED", error);
            return;
        }

        MediaScannerConnection.scanFile(
            getContext(),
            new String[] { target.getAbsolutePath() },
            new String[] { MIME_TYPE },
            null
        );
        resolveSaved(call, Uri.fromFile(target).toString(), target.getName());
    }

    private void resolveSaved(PluginCall call, String uri, String fileName) {
        JSObject response = new JSObject();
        response.put("uri", uri);
        response.put("fileName", fileName);
        call.resolve(response);
    }

    private File uniqueFile(File directory, long initialTimestamp) {
        long candidateTimestamp = initialTimestamp;
        File candidate = new File(
            directory,
            ShareCardPayload.createFileName(candidateTimestamp, TimeZone.getDefault())
        );
        while (candidate.exists()) {
            candidateTimestamp += 1000L;
            candidate = new File(
                directory,
                ShareCardPayload.createFileName(candidateTimestamp, TimeZone.getDefault())
            );
        }
        return candidate;
    }

    private void cleanupShareCache(File directory) {
        File[] files = directory.listFiles((ignored, name) -> name.startsWith("Decision-Lab-") && name.endsWith(".png"));
        if (files == null) return;

        long oldestAllowed = System.currentTimeMillis() - CACHE_MAX_AGE_MS;
        for (File file : files) {
            if (file.lastModified() < oldestAllowed) deleteQuietly(file);
        }

        File[] remaining = directory.listFiles((ignored, name) -> name.startsWith("Decision-Lab-") && name.endsWith(".png"));
        if (remaining == null) return;
        Arrays.sort(remaining, Comparator.comparingLong(File::lastModified).reversed());
        int existingToKeep = MAX_CACHED_FILES - 1;
        for (int index = existingToKeep; index < remaining.length; index += 1) {
            deleteQuietly(remaining[index]);
        }
    }

    private void deleteQuietly(File file) {
        if (file.exists()) file.delete();
    }
}
