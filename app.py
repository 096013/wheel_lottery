from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

DEFAULT_PRIZES = [
    "頭獎",
    "二獎",
    "三獎",
    "神秘禮物",
    "精美文具",
    "安慰獎"
]

DEFAULT_PLAYERS = [
    "武氏玉映", "甲氏秋和", "藍廷郁", "亞莉珊", "簡艾波", "卡莉兒", "克里斯",
    "艾而潔", "艾米莉", "易芙琳", "吉思爾", "艾芮希", "羅琮妮", "簡米娜",
    "安利茲", "瑪莉蓮", "商米爾", "羅納德", "艾爾文", "裘莎瑪", "梅西莎",
    "艾莉卡", "富迪鎷", "法蒂瑪", "傑琦雅", "畢塔戈", "易傑克", "喬洛瑪",
    "朱莉娜", "詹瑞德", "卡珊卓", "肯尼斯", "絜蕾蒂", "幸運爾", "馬爾克",
    "莫爾珍", "齊麥克", "那芙", "賴瓦昇", "申瑞莎", "李凱揚", "史蒂芬",
    "莫妮卡", "林一帆", "欣倩", "王瑛芮", "李康", "艾芬琪"
]


@app.route("/")
def index():
    return render_template(
        "index.html",
        prizes=DEFAULT_PRIZES,
        players=DEFAULT_PLAYERS
    )

@app.route("/spin", methods=["POST"])
def spin():
    data = request.get_json()

    prizes = data.get("prizes", [])
    players = data.get("players", [])
    winners = data.get("winners", [])

    prizes = [p.strip() for p in prizes if p.strip()]
    players = [p.strip() for p in players if p.strip()]

    used_prizes = set()
    used_players = set()

    for item in winners:
        prize = item.get("prize", "").strip()
        player = item.get("player", "").strip()
        if prize:
            used_prizes.add(prize)
        if player:
            used_players.add(player)

    remaining_prizes = [p for p in prizes if p not in used_prizes]
    remaining_players = [p for p in players if p not in used_players]

    if not remaining_prizes:
        return jsonify({"error": "所有獎品都已抽完"}), 400

    if not remaining_players:
        return jsonify({"error": "所有抽獎者都已中獎"}), 400

    prize_index = random.randint(0, len(remaining_prizes) - 1)
    player_index = random.randint(0, len(remaining_players) - 1)

    winner_prize = remaining_prizes[prize_index]
    winner_player = remaining_players[player_index]

    return jsonify({
        "winner_prize": winner_prize,
        "winner_player": winner_player,
        "remaining_prizes": remaining_prizes,
        "wheel_index": prize_index
    })

if __name__ == "__main__":
    app.run(debug=True)