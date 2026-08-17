package com.qct.server.common;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 云函数风格结果构造器：
 * 成功 -> { success: true, data: ... } 或 { success: true, message: ... }
 * 失败 -> { success: false, error: ... }
 */
public final class R {

    private R() {
    }

    public static Map<String, Object> ok(Object data) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("success", true);
        map.put("data", data);
        return map;
    }

    public static Map<String, Object> okMsg(String message) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("success", true);
        map.put("message", message);
        return map;
    }

    public static Map<String, Object> ok(Object data, String message) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("success", true);
        map.put("data", data);
        map.put("message", message);
        return map;
    }

    public static Map<String, Object> fail(String error) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("success", false);
        map.put("error", error);
        return map;
    }

    public static Map<String, Object> fail(String error, String message) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("success", false);
        map.put("error", error);
        map.put("message", message);
        return map;
    }
}
