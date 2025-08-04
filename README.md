# Extrator de Paleta de Cores

Este é um projeto web completo para extrair a paleta de cores dominante de uma imagem usando o algoritmo K-means. A aplicação oferece uma interface amigável para carregar imagens e visualizar os resultados, além de uma API robusta para integração com outras plataformas.

## Funcionalidades

- **Extração de Paleta de Cores:** Identifica as cores mais proeminentes em uma imagem usando algoritmo K-means
- **Interface Web Moderna:** Interface responsiva com arrastar e soltar arquivos, visualização da imagem e paleta extraída
- **API RESTful:** Endpoint para extrair paletas programaticamente, retornando dados em formato JSON
- **Opções de Visualização:** Alterne entre a visualização completa (HEX, RGB, Porcentagem) e simplificada (apenas HEX)
- **Exemplos de Aplicação:** Visualize como a paleta de cores pode ser aplicada em diferentes contextos (texto, cartões, layouts de website)
- **Download da Paleta:** Baixe a paleta de cores em um arquivo JSON
- **Parâmetros Customizáveis:** Ajuste o número de cores, porcentagem mínima e tolerância de similaridade

## Pré-requisitos

- Python 3.7 ou superior
- pip (gerenciador de pacotes do Python)

## Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/extrator-paleta.git
   cd extrator-paleta
   ```

2. **Crie e ative um ambiente virtual:**
   ```bash
   python -m venv venv
   
   # No Windows
   venv\Scripts\activate
   
   # No macOS/Linux
   source venv/bin/activate
   ```

3. **Instale as dependências:**
   ```bash
   pip install Flask opencv-python numpy scikit-learn Pillow uvicorn gunicorn
   ```

## Como Executar

Você pode executar a aplicação usando o servidor de desenvolvimento nativo do Flask ou, para um ambiente de produção, usando o **Gunicorn com o Uvicorn worker**.

### 1. Execução para Desenvolvimento

Execute o arquivo `app.py` para iniciar o servidor de desenvolvimento:

```bash
python app.py
```

O aplicativo estará disponível em **http://localhost:5000**

### 2. Execução para Produção (Gunicorn + Uvicorn)

Para ambientes de produção, use o Gunicorn com o worker Uvicorn:

```bash
gunicorn --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:5000 app:app
```

**Parâmetros explicados:**
- `--workers 4`: Número de processos worker (recomendado: número de núcleos da CPU)
- `--worker-class uvicorn.workers.UvicornWorker`: Usa o worker do Uvicorn para melhor performance
- `--bind 0.0.0.0:5000`: Vincula o servidor ao endereço e porta especificados
- `app:app`: Carrega a aplicação Flask do arquivo `app.py`

## Uso da API

O endpoint principal para extração da paleta é `POST /api/extract_palette`. Ele aceita um arquivo de imagem e parâmetros opcionais via `multipart/form-data`.

### Parâmetros da Requisição

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|---------|-----------|
| `file` | arquivo | ✅ | - | Arquivo de imagem a ser processado |
| `num_colors` | inteiro | ❌ | 5 | Número de cores desejadas na paleta |
| `tolerance` | inteiro | ❌ | 30 | Nível de similaridade para filtragem de cores |
| `min_percent` | float | ❌ | 5.0 | Porcentagem mínima que uma cor deve representar |

### Exemplos de Requisição

#### cURL - Requisição básica
```bash
curl -X POST \
  -F "file=@/caminho/da/sua/imagem.png" \
  http://localhost:5000/api/extract_palette
```

#### cURL - Requisição com parâmetros customizados
```bash
curl -X POST \
  -F "file=@/caminho/da/sua/imagem.png" \
  -F "num_colors=8" \
  -F "tolerance=25" \
  -F "min_percent=3.5" \
  http://localhost:5000/api/extract_palette
```

#### JavaScript - Usando Fetch API
```javascript
const formData = new FormData();
const fileInput = document.querySelector('input[type="file"]');
formData.append('file', fileInput.files[0]);
formData.append('num_colors', 6);
formData.append('tolerance', 40);
formData.append('min_percent', 2.0);

fetch('/api/extract_palette', {
  method: 'POST',
  body: formData
})
.then(response => {
  if (!response.ok) {
    throw new Error('Erro na requisição');
  }
  return response.json();
})
.then(data => {
  console.log('Paleta extraída:', data.palette);
})
.catch(error => {
  console.error('Erro:', error);
});
```

#### Python - Usando requests
```python
import requests

url = 'http://localhost:5000/api/extract_palette'
files = {'file': open('imagem.jpg', 'rb')}
data = {
    'num_colors': 5,
    'tolerance': 30,
    'min_percent': 5.0
}

response = requests.post(url, files=files, data=data)
if response.status_code == 200:
    palette = response.json()
    print('Paleta extraída:', palette['palette'])
else:
    print('Erro:', response.json())
```

### Exemplo de Resposta da API

```json
{
  "success": true,
  "palette": [
    {
      "hex": "#FF5733",
      "rgb": [255, 87, 51],
      "percentage": 28.5
    },
    {
      "hex": "#33A1FF",
      "rgb": [51, 161, 255],
      "percentage": 23.2
    },
    {
      "hex": "#28A745",
      "rgb": [40, 167, 69],
      "percentage": 18.7
    }
  ],
  "total_colors": 3,
  "processing_time": 0.85
}
```

## Estrutura do Projeto

```
extrator-paleta/
├── app.py                 # Aplicação Flask principal
├── static/
│   ├── css/
│   │   └── style.css     # Estilos da interface
│   └── js/
│       └── script.js     # JavaScript da interface
├── templates/
│   └── index.html        # Template HTML principal
├── requirements.txt       # Dependências do projeto
└── README.md             # Este arquivo
```

## Formatos de Imagem Suportados

- PNG
- JPEG/JPG
- BMP
- TIFF
- WebP

## Tecnologias Utilizadas

- **Backend:** Flask (Python)
- **Processamento de Imagem:** OpenCV, Pillow
- **Algoritmo de Clustering:** Scikit-learn (K-means)
- **Servidor de Produção:** Gunicorn + Uvicorn
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)

## Contribuições

Contribuições são bem-vindas! Por favor, siga estes passos:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## Desenvolvedor

**DSantos Info**
- Website: [www.dsantosinfo.com.br](https://www.dsantosinfo.com.br)
- Telefone: (21) 99053-2437

---

*Desenvolvido com ❤️ para a comunidade de desenvolvedores*