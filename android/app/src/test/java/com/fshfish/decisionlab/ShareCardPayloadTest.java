package com.fshfish.decisionlab;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;

import java.util.Base64;
import java.util.Calendar;
import java.util.Locale;
import java.util.TimeZone;
import org.junit.Test;

public class ShareCardPayloadTest {

    private static final byte[] PNG_SIGNATURE = new byte[] {
        (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    };

    @Test
    public void decodesValidPngUnderLimit() throws Exception {
        byte[] png = new byte[PNG_SIGNATURE.length + 1];
        System.arraycopy(PNG_SIGNATURE, 0, png, 0, PNG_SIGNATURE.length);
        png[png.length - 1] = 1;

        assertArrayEquals(png, ShareCardPayload.decodePng(Base64.getEncoder().encodeToString(png)));
    }

    @Test
    public void rejectsMalformedBase64() {
        assertPayloadError("INVALID_BASE64", () -> ShareCardPayload.decodePng("%%%"));
    }

    @Test
    public void rejectsPayloadAboveTenMegabytes() {
        byte[] png = new byte[ShareCardPayload.MAX_BYTES + 1];
        System.arraycopy(PNG_SIGNATURE, 0, png, 0, PNG_SIGNATURE.length);
        String encoded = Base64.getEncoder().encodeToString(png);

        assertPayloadError("IMAGE_TOO_LARGE", () -> ShareCardPayload.decodePng(encoded));
    }

    @Test
    public void rejectsNonPngSignature() {
        assertPayloadError("INVALID_BASE64", () -> ShareCardPayload.decodePng(Base64.getEncoder().encodeToString(new byte[16])));
    }

    @Test
    public void createsControlledTimestampedFilename() {
        TimeZone timeZone = TimeZone.getTimeZone("Asia/Shanghai");
        Calendar calendar = Calendar.getInstance(timeZone, Locale.US);
        calendar.clear();
        calendar.set(2026, Calendar.AUGUST, 30, 17, 39, 0);

        assertEquals(
            "Decision-Lab-20260830-173900.png",
            ShareCardPayload.createFileName(calendar.getTimeInMillis(), timeZone)
        );
    }

    private static void assertPayloadError(String code, ThrowingAction action) {
        try {
            action.run();
            fail("Expected ShareCardPayloadException");
        } catch (ShareCardPayload.ShareCardPayloadException error) {
            assertEquals(code, error.getCode());
        } catch (Exception error) {
            fail("Unexpected exception: " + error.getClass().getName());
        }
    }

    private interface ThrowingAction {
        void run() throws Exception;
    }
}
