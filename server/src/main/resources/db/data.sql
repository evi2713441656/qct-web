-- 默认数据：管理员账户 + 系统配置
-- 默认管理员：admin / admin123（密码为 SHA-256 摘要）

INSERT IGNORE INTO admins (id, username, password, name, user_id, role, status, permissions, last_login_time, created_at, updated_at)
VALUES ('admin_001', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
        '系统管理员', 'system_admin_001', 'super_admin', 'active',
        JSON_ARRAY('user_management', 'application_management', 'system_config', 'data_export', 'notification_send'),
        NULL, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000);

INSERT INTO system_config (id, recruitment_time, department_details, interview_config, system_settings, application_start_time, application_end_time, edit_deadline, created_at, updated_at)
SELECT 'sysconfig_default',
       JSON_OBJECT('startDate', '2025-08-01', 'endDate', '2025-10-15', 'endTime', '23:59', 'admissionDate', '', 'admissionTime', '23:59'),
       JSON_OBJECT(
           '策划部', JSON_OBJECT('name', '策划部', 'shortName', '策划', 'color', '#FF6B6B', 'description', '协会的"大脑"',
               'introduction', '作为协会的核心部门，策划部肩负着活动从构思到落地的全流程工作。在这里，你将主导活动方案设计，协调各部门分工，把控每个执行细节，用专业与创意打造精彩活动。加入策划组，你不仅能系统学习活动策划、应急处理等实用技能，更能收获将创意变为现实的成就感。我们寻找思维缜密、责任心强的小伙伴，也欢迎零基础但充满热情的你！别担心经验不足，我们将提供专业培训，只要你态度认真，这里就是展现才华的完美舞台。期待与你一起，用智慧点燃每一个创新火花！',
               'duties', JSON_ARRAY('活动方案设计与策划', '各部门协调与分工安排', '活动执行细节把控', '项目进度管理与风险控制'),
               'requirements', JSON_ARRAY('思维缜密，逻辑清晰', '责任心强，执行力佳', '具备良好的沟通协调能力', '有创新思维和团队合作精神')),
           '执行部', JSON_OBJECT('name', '执行部', 'shortName', '执行', 'color', '#4ECDC4', 'description', '协会的"行动力"',
               'introduction', '在这里，我们执行部诚挚邀请每一位怀揣热情的小伙伴加入！不论你是责任心强、性格开朗，还是渴望挑战自我、突破舒适区，执行部都将成为你成长的舞台。通过参与活动的全流程实践，从前期筹备到现场执行，你将全面提升组织协调与沟通交际能力。更棒的是，我们还为想要锻炼主持才能的同学提供展示机会！在这里，你将收获的不仅是能力的提升，更有真挚的伙伴情谊。勇敢迈出第一步，让执行部见证你的蜕变与成长！我们期待与你一起，在实干中收获精彩！',
               'duties', JSON_ARRAY('活动前期筹备与物资准备', '现场执行与协调管理', '主持与现场氛围营造', '突发情况应急处理'),
               'requirements', JSON_ARRAY('责任心强，性格开朗', '具备良好的组织协调能力', '有较强的沟通交际能力', '能够承受一定的工作压力')),
           '宣传部', JSON_OBJECT('name', '宣传部', 'shortName', '宣传', 'color', '#45B7D1', 'description', '协会的"信息窗口"',
               'introduction', '在这里，我们玩转文字与视觉的艺术，用推文排版构筑信息之美，以影像设计传递创新能量。作为协会的创意窗口，你将系统掌握新媒体运营全技能：从文案创作到视觉排版，从摄影技巧到图片处理，全方位提升数字媒体素养。我们寻找对新媒体充满热忱的探索者，无论你是初窥门径还是小有所成，这里都有属于你的创作舞台。加入我们，让每一份创意都被看见，每一次成长都被记录！用年轻的声音，讲述属于青创的精彩故事！',
               'duties', JSON_ARRAY('新媒体内容创作与编辑', '视觉设计与图片处理', '摄影摄像与后期制作', '品牌形象设计与维护'),
               'requirements', JSON_ARRAY('对新媒体运营充满热忱', '具备良好的文字表达能力', '有审美能力和创意思维', '熟悉设计软件或愿意学习'))
       ),
       NULL,
       JSON_OBJECT('maxApplicationsPerUser', 1, 'allowEdit', true, 'enableNotifications', true),
       '2025-08-01T00:00:00', '2025-10-15T23:59:59', '2025-10-15T23:59:59',
       UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000
WHERE NOT EXISTS (SELECT 1 FROM system_config);
