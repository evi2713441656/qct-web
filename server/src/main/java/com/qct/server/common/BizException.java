package com.qct.server.common;

/**
 * 业务异常：message 会作为云函数风格的 error 返回给前端。
 */
public class BizException extends RuntimeException {

    public BizException(String message) {
        super(message);
    }
}
