import json
from flask import Flask, request, jsonify, render_template, send_from_directory
from werkzeug.utils import secure_filename
from palette_extractor import extract_palette_from_image, extract_simplified_palette
import os
from datetime import datetime

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Garante que a pasta de uploads existe
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/', methods=['GET'])
def index():
    """Rota para a interface web."""
    return render_template('index.html')

@app.route('/api/extract_palette', methods=['POST'])
def api_extract_palette():
    """
    Endpoint da API para extrair a paleta de cores de uma imagem.
    """
    if 'file' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Nome do arquivo vazio"}), 400

    if file:
        try:
            # Salva o arquivo temporariamente para processamento
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            filename = f"{timestamp}_{secure_filename(file.filename)}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Lê o arquivo salvo
            with open(filepath, 'rb') as f:
                image_data = f.read()
            
            # Pega parâmetros do formulário
            num_colors = int(request.form.get('num_colors', 5))
            min_percent = float(request.form.get('min_percent', 5.0))
            tolerance = int(request.form.get('tolerance', 30))
            palette_type = request.form.get('palette_type', 'full')

            # Extrai a paleta
            if palette_type == 'simplified':
                palette = extract_simplified_palette(image_data, num_colors, min_percent, tolerance)
                result = {
                    "palette": palette,
                    "metadata": {
                        "source": secure_filename(file.filename),
                        "palette_type": "simplified",
                        "requested_color_count": num_colors,
                        "filtered_color_count": len(palette),
                        "min_percent": min_percent,
                        "color_similarity_tolerance": tolerance,
                        "algorithm": "K-means"
                    }
                }
            else:
                palette = extract_palette_from_image(image_data, num_colors, min_percent, tolerance)
                result = {
                    "palette": palette,
                    "metadata": {
                        "source": secure_filename(file.filename),
                        "palette_type": "full",
                        "requested_color_count": num_colors,
                        "filtered_color_count": len(palette),
                        "min_percent": min_percent,
                        "color_similarity_tolerance": tolerance,
                        "algorithm": "K-means"
                    }
                }
            
            # Remove o arquivo temporário
            os.remove(filepath)
            
            return jsonify(result)
        
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            app.logger.error(f"Erro ao processar imagem: {str(e)}")
            return jsonify({"error": f"Ocorreu um erro interno: {e}"}), 500
        
        
@app.route('/api/generate_example', methods=['POST'])
def generate_example():
    """Endpoint para gerar exemplos de aplicação da paleta."""
    data = request.json
    if not data or 'palette' not in data:
        return jsonify({"error": "Dados da paleta não fornecidos"}), 400
    
    try:
        # Aqui você pode implementar a geração de exemplos
        # Retornando URLs de imagens geradas ou HTML de exemplo
        examples = {
            "text": generate_text_example(data['palette']),
            "card": generate_card_example(data['palette']),
            "website": generate_website_example(data['palette'])
        }
        return jsonify(examples)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_text_example(palette):
    """Gera exemplo de texto com a paleta aplicada."""
    # Implementação real geraria imagens ou HTML
    return {
        "html": f"<div style='color: {palette[0]['hex']}'>Texto exemplo</div>",
        "description": "Texto com cores da paleta aplicada"
    }

def generate_card_example(palette):
    """Gera exemplo de card com a paleta."""
    return {
        "html": f"<div class='card' style='background: {palette[1]['hex']}'></div>",
        "description": "Cartão usando a paleta"
    }

def generate_website_example(palette):
    """Gera exemplo de website com a paleta."""
    return {
        "html": "<div>Exemplo de layout</div>",
        "description": "Layout de site usando a paleta"
    }


@app.route('/download-palette', methods=['POST'])
def download_palette():
    """Endpoint para download da paleta em formato JSON."""
    data = request.json
    if not data:
        return jsonify({"error": "Nenhum dado recebido"}), 400
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"paleta_cores_{timestamp}.json"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    
    return send_from_directory(
        app.config['UPLOAD_FOLDER'],
        filename,
        as_attachment=True,
        mimetype='application/json'
    )

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)