from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import socket
import os
import webbrowser
import threading
from threading import Timer
from engineio.async_drivers import threading

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*",async_mode="threading")

connected_judges = []

def get_local_ip():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        try:
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
        except Exception:
            local_ip = "127.0.0.1"
    return local_ip

@app.route('/local_ip', methods=['GET'])
def get_local_ip_route():
    return jsonify({"local_ip": get_local_ip()}), 200

@app.route('/')
def serve_react_app():
    return render_template('index.html')

participants = {
    "redName": "Имя Красного Участника",
    "blueName": "Имя Синего Участника"
}

@app.route('/participant_names', methods=['GET'])
def get_participant_names():
    return jsonify(participants), 200

@app.route('/update_participant_names', methods=['POST'])
def update_participant_names():
    global participants
    data = request.json
    participants['redName'] = data.get('redName', participants['redName'])
    participants['blueName'] = data.get('blueName', participants['blueName'])
    socketio.emit('update_names', participants)
    return jsonify(participants), 200

@app.route('/webhook', methods=['POST'])
def handle_webhook():
    data = request.json
    participants['redName'] = data.get('redName', participants['redName'])
    participants['blueName'] = data.get('blueName', participants['blueName'])
    socketio.emit('update_names', participants)
    return jsonify({"message": "Webhook received"}), 200

@app.route('/<path:path>')
def serve_static_files(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    emit('update_names', participants)

# Создаем массив для хранения данных о нажатиях кнопок
button_clicks = []

@app.route('/submit_judge_name', methods=['POST'])
def submit_judge_name():
    data = request.json
    judge_name = data.get("judge_name")
    
    # Проверяем, есть ли имя судьи уже в списке подключенных судей
    if judge_name not in connected_judges:
        connected_judges.append(judge_name)
        
    # Отправляем обновленный список всех подключенных судей всем клиентам через сокеты
    socketio.emit('update_judges', {
        "connected_judges": connected_judges
    })
    
    # Логирование полученных данных
    print(f"Judge Name: {judge_name}")
    print(f"Connected judges: {connected_judges}")
    
    return jsonify({"message": "Judge name received", "data": data}), 200

# Запрашиваем судей при открытии страницы
@socketio.on('request_judges')
def handle_request_judges():
    # Emit the current list of connected judges to the requesting client
    socketio.emit('update_judges', {
        "connected_judges": connected_judges
    })


@app.route('/handle_button_click', methods=['POST'])
def handle_button_click():
    data = request.json
    judge_name = data.get("judge-name")
    button_index = data.get("button-index")
    button_column = data.get("button-column")
    button_row = data.get("button-row")
    
    # Обрабатываем данные и добавляем их в массив
    button_clicks.append({
        "judge_name": judge_name,
        "button_index": button_index,
        "button_column": button_column,
        "button_row": button_row
    })
    
    # Логирование полученных данных
    print(f"Judge Name: {judge_name}, Button Index: {button_index}, Button Column: {button_column}, Button Row: {button_row}")
    
    # Отправляем данные всем подключенным клиентам через сокеты
    socketio.emit('update_table', {
        "judge_name": judge_name,
        "button_index": button_index,
        "button_column": button_column,
        "button_row": button_row 
    })
    
    return jsonify({"message": "Button click received", "data": data}), 200


def open_browser():
    webbrowser.open_new("http://localhost:5000")

# Настраиваем таймер для открытия браузера через 1 секунду после запуска сервера
Timer(1, open_browser).start()


socketio.run(app, host='0.0.0.0', port=5000, debug=False)

