package com.qct.server.controller;

import com.qct.server.service.AdminApiService;
import com.qct.server.service.AdminService;
import com.qct.server.service.ApplicationService;
import com.qct.server.service.AuthService;
import com.qct.server.common.R;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 云函数风格统一入口：
 * POST /api/cloud/{functionName}
 * 请求体与 uniCloud callFunction 的 data 一致，返回体与云函数 result 一致。
 */
@RestController
@RequestMapping("/api/cloud")
public class CloudController {

    private final AuthService authService;
    private final ApplicationService applicationService;
    private final AdminService adminService;
    private final AdminApiService adminApiService;

    public CloudController(AuthService authService,
                           ApplicationService applicationService,
                           AdminService adminService,
                           AdminApiService adminApiService) {
        this.authService = authService;
        this.applicationService = applicationService;
        this.adminService = adminService;
        this.adminApiService = adminApiService;
    }

    @PostMapping("/auth")
    public Map<String, Object> auth(@RequestBody Map<String, Object> event) {
        return authService.dispatch(event);
    }

    @PostMapping("/application")
    public Map<String, Object> application(@RequestBody Map<String, Object> event) {
        return applicationService.dispatch(event);
    }

    @PostMapping("/admin")
    public Map<String, Object> admin(@RequestBody Map<String, Object> event) {
        return adminService.dispatch(event);
    }

    @PostMapping("/admin-api")
    public Map<String, Object> adminApi(@RequestBody Map<String, Object> event) {
        return adminApiService.dispatch(event);
    }

    @PostMapping("/wechat-login")
    public Map<String, Object> wechatLogin(@RequestBody Map<String, Object> event) {
        return R.fail("网页版不支持微信登录，请使用学号 + 姓名登录");
    }

    @PostMapping("/wechat-push")
    public Map<String, Object> wechatPush(@RequestBody Map<String, Object> event) {
        return R.fail("网页版不支持微信消息推送");
    }

    @PostMapping("/init-db")
    public Map<String, Object> initDb(@RequestBody Map<String, Object> event) {
        // 数据库结构由服务启动时自动初始化（schema.sql / data.sql）
        return R.okMsg("数据库初始化完成");
    }
}
