import cv2
import numpy as np
import io
from sklearn.cluster import KMeans
from PIL import Image

def filter_palette(palette, min_percent=5.0, tolerance=30):
    """Filtra cores por porcentagem mínima e similaridade."""
    filtered = []
    for color in palette:
        if color["percentage"] >= min_percent:
            similar = False
            for added in filtered:
                diff = np.sum(np.abs(np.array(color["rgb"]) - np.array(added["rgb"])))
                if diff < tolerance:
                    similar = True
                    break
            if not similar:
                filtered.append(color)
    return filtered

def extract_palette_from_image(image_data, num_colors=5, min_percent=5.0, tolerance=30):
    """
    Extrai a paleta de cores de dados de imagem (bytes).
    Retorna uma lista de cores (dicionários) com informações completas.
    """
    try:
        image = Image.open(io.BytesIO(image_data))
        # Converte para formato BGR e depois para um array numpy
        image_np = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        image_np = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
    except Exception as e:
        raise ValueError(f"Não foi possível processar a imagem: {e}")

    pixels = image_np.reshape(-1, 3)

    # Aplica K-means para encontrar as cores dominantes
    kmeans = KMeans(n_clusters=num_colors, n_init=10, random_state=42)
    kmeans.fit(pixels)

    # Obtém as cores e suas porcentagens
    colors = kmeans.cluster_centers_.astype(int)
    counts = np.bincount(kmeans.labels_)
    percentages = (counts / len(pixels)) * 100

    # Ordena as cores pela frequência
    sorted_indices = np.argsort(percentages)[::-1]
    colors = colors[sorted_indices]
    percentages = percentages[sorted_indices]

    palette = []
    for color, percent in zip(colors, percentages):
        hex_color = "#{:02X}{:02X}{:02X}".format(*color)
        palette.append({
            "hex": hex_color,
            "rgb": color.tolist(),
            "percentage": round(percent, 2)
        })

    # Aplica filtros
    return filter_palette(palette, min_percent, tolerance)

def extract_simplified_palette(image_data, num_colors=5, min_percent=5.0, tolerance=30):
    """
    Extrai a paleta de cores e retorna uma lista simplificada de códigos hex.
    """
    full_palette = extract_palette_from_image(image_data, num_colors, min_percent, tolerance)
    return [color['hex'] for color in full_palette]