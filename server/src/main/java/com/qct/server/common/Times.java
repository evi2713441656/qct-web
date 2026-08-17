package com.qct.server.common;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * 时间工具：与 uniCloud JS Date 的 JSON 序列化保持一致（UTC ISO 字符串）。
 */
public final class Times {

    private static final DateTimeFormatter ISO = DateTimeFormatter
            .ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            .withZone(ZoneOffset.UTC);

    private Times() {
    }

    public static long now() {
        return System.currentTimeMillis();
    }

    /** 毫秒时间戳 -> "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'" */
    public static String iso(Long ms) {
        if (ms == null || ms <= 0) {
            return null;
        }
        return ISO.format(Instant.ofEpochMilli(ms));
    }
}
