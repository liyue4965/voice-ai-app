#!/bin/bash
# OpenClaw 记忆系统自动化脚本

WORKSPACE="/root/.openclaw/workspace"
cd "$WORKSPACE" || exit 1

# 加载环境变量（Git token）
export GITHUB_TOKEN="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"

# 通知函数 - 通过 OpenClaw API 发送飞书消息
notify() {
    local msg="$1"
    echo "$(date): 发送通知: $msg"
    
    # 尝试通过 OpenClaw CLI 发送消息
    local payload="{\"channel\":\"feishu\",\"target\":\"ou_f12cee23292ff7a5164eb9ada96bd67e\",\"message\":\"$msg\"}"
    
    # 尝试多种方式发送
    # 方式1: 通过 OpenClaw Gateway API
    curl -s -X POST 'http://localhost:3000/v1/messages/send' \
        -H 'Content-Type: application/json' \
        -d "$payload" 2>/dev/null
    
    # 方式2: 写入待发送队列（由 OpenClaw 主进程处理）
    echo "$(date '+%Y-%m-%d %H:%M:%S')|$msg" >> /tmp/memory-pending-notifications
}

# 获取当前时间
HOUR=$(date +%H)
WEEKDAY=$(date +%u)  # 1=周一, 7=周日

# ============ 每小时任务 ============
if [ "$1" = "hourly" ]; then
    echo "$(date): 开始每小时 Git commit..."
    
    # 添加所有变更
    git add -A
    
    # 如果有变更，则 commit
    if git diff --staged --quiet; then
        # 检查是否有未推送的 commit
        if git log origin/记忆..HEAD --oneline | grep -q .; then
            echo "$(date): 有未推送的 commit，重试推送..."
            if git push origin 记忆 2>&1; then
                echo "$(date): 已推送"
                notify "🧠 记忆已自动同步（每小时）"
            else
                echo "$(date): 推送失败，保留待下次重试"
            fi
        else
            echo "$(date): 无新变更，跳过"
        fi
    else
        git commit -m "auto: $(date '+%Y-%m-%d %H:%M') update"
        if git push origin 记忆 2>&1; then
            echo "$(date): 已推送"
            notify "🧠 记忆已自动同步（每小时）"
        else
            echo "$(date): 推送失败，保留待下次重试"
        fi
    fi
    exit 0
fi

# ============ 每天任务 (小冥想 02:30) ============
if [ "$1" = "daily" ]; then
    echo "$(date): 开始每日小冥想..."
    
    # 更新 MEMORY.md 中的日期
    sed -i "s/最后更新.*/最后更新：$(date '+%Y-%m-%d')/" "$WORKSPACE/MEMORY.md" 2>/dev/null
    
    # 推送到 Git
    git add MEMORY.md memory/
    git commit -m "feat: daily meditation $(date '+%Y-%m-%d')"
    if git push origin 记忆 2>/dev/null; then
        notify "🧠 小冥想完成，记忆已同步"
    fi
    
    echo "$(date): 小冥想完成"
    exit 0
fi

# ============ 每周任务 (大冥想 周日 05:00) ============
if [ "$1" = "weekly" ]; then
    if [ "$WEEKDAY" != "7" ]; then
        echo "今天不是周日，跳过大冥想"
        exit 0
    fi
    
    echo "$(date): 开始每周大冥想..."
    
    # 1. 清理旧日记（超过 30 天的移到 archive）
    mkdir -p "$WORKSPACE/memory/archive"
    find "$WORKSPACE/memory" -name "*.md" -mtime +30 ! -name "archive" -exec mv {} "$WORKSPACE/memory/archive/" \; 2>/dev/null
    
    # 2. 精简 MEMORY.md（保持 < 10KB）
    SIZE=$(stat -f%z "$WORKSPACE/MEMORY.md" 2>/dev/null || stat -c%s "$WORKSPACE/MEMORY.md")
    if [ "$SIZE" -gt 10240 ]; then
        echo "MEMORY.md 超过 10KB，需要精简"
        # 简单策略：删除已完成项目
        sed -i '/已完成项目/,/---/d' "$WORKSPACE/MEMORY.md"
    fi
    
    # 3. 生成周报
    WEEK_NUM=$(date '+%U')
    echo "# 周报 $(date '+%Y-%W')" > "$WORKSPACE/memory/weekly-$(date '+%Y-%m-%d').md"
    git log --oneline --since="7 days ago" >> "$WORKSPACE/memory/weekly-$(date '+%Y-%m-%d').md"
    
    # 4. 提交并推送
    git add -A
    git commit -m "feat: weekly meditation $(date '+%Y-%m-%d')"
    if git push origin 记忆 2>/dev/null; then
        notify "🧠 大冥想完成（周报生成 + 记忆精简）"
    fi
    
    echo "$(date): 大冥想完成"
    exit 0
fi

echo "用法: $0 {hourly|daily|weekly}"
