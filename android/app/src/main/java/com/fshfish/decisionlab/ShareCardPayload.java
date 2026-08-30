package com.fshfish.decisionlab;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

final class ShareCardPayload {

    static final int MAX_BYTES = 10 * 1024 * 1024;
    private static final int MAX_BASE64_LENGTH = ((MAX_BYTES + 2) / 3) * 4;
    private static final byte[] PNG_SIGNATURE = new byte[] {
        (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    };
    private ShareCardPayload() {}

    static byte[] decodePng(String base64) throws ShareCardPayloadException {
        if (base64 == null || base64.trim().isEmpty()) {
            throw new ShareCardPayloadException("INVALID_BASE64", "PNG Base64 is required");
        }
        if (base64.length() > MAX_BASE64_LENGTH + 4) {
            throw new ShareCardPayloadException("IMAGE_TOO_LARGE", "Decoded PNG exceeds 10 MB");
        }

        final byte[] decoded = decodeBase64(base64);

        if (decoded.length > MAX_BYTES) {
            throw new ShareCardPayloadException("IMAGE_TOO_LARGE", "Decoded PNG exceeds 10 MB");
        }
        if (decoded.length < PNG_SIGNATURE.length) {
            throw new ShareCardPayloadException("INVALID_BASE64", "Decoded payload is not a PNG");
        }
        for (int index = 0; index < PNG_SIGNATURE.length; index += 1) {
            if (decoded[index] != PNG_SIGNATURE[index]) {
                throw new ShareCardPayloadException("INVALID_BASE64", "Decoded payload is not a PNG");
            }
        }
        return decoded;
    }

    static String createFileName(long epochMillis, TimeZone timeZone) {
        SimpleDateFormat format = new SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US);
        format.setTimeZone(timeZone);
        return "Decision-Lab-" + format.format(new Date(epochMillis)) + ".png";
    }

    private static byte[] decodeBase64(String encoded) throws ShareCardPayloadException {
        int length = encoded.length();
        if (length % 4 != 0) {
            throw malformedBase64();
        }

        int padding = 0;
        if (length > 0 && encoded.charAt(length - 1) == '=') padding += 1;
        if (length > 1 && encoded.charAt(length - 2) == '=') padding += 1;
        byte[] decoded = new byte[(length / 4) * 3 - padding];
        int outputIndex = 0;

        for (int index = 0; index < length; index += 4) {
            boolean lastGroup = index + 4 == length;
            char third = encoded.charAt(index + 2);
            char fourth = encoded.charAt(index + 3);
            if ((!lastGroup && (third == '=' || fourth == '=')) || (third == '=' && fourth != '=')) {
                throw malformedBase64();
            }

            int firstValue = base64Value(encoded.charAt(index));
            int secondValue = base64Value(encoded.charAt(index + 1));
            int thirdValue = third == '=' ? 0 : base64Value(third);
            int fourthValue = fourth == '=' ? 0 : base64Value(fourth);
            if (firstValue < 0 || secondValue < 0 || thirdValue < 0 || fourthValue < 0) {
                throw malformedBase64();
            }

            int combined = (firstValue << 18) | (secondValue << 12) | (thirdValue << 6) | fourthValue;
            if (outputIndex < decoded.length) decoded[outputIndex++] = (byte) (combined >> 16);
            if (outputIndex < decoded.length) decoded[outputIndex++] = (byte) (combined >> 8);
            if (outputIndex < decoded.length) decoded[outputIndex++] = (byte) combined;
        }
        return decoded;
    }

    private static int base64Value(char character) {
        if (character >= 'A' && character <= 'Z') return character - 'A';
        if (character >= 'a' && character <= 'z') return character - 'a' + 26;
        if (character >= '0' && character <= '9') return character - '0' + 52;
        if (character == '+') return 62;
        if (character == '/') return 63;
        return -1;
    }

    private static ShareCardPayloadException malformedBase64() {
        return new ShareCardPayloadException("INVALID_BASE64", "PNG Base64 is malformed");
    }

    static final class ShareCardPayloadException extends Exception {

        private final String code;

        ShareCardPayloadException(String code, String message) {
            super(message);
            this.code = code;
        }

        ShareCardPayloadException(String code, String message, Throwable cause) {
            super(message, cause);
            this.code = code;
        }

        String getCode() {
            return code;
        }
    }
}
