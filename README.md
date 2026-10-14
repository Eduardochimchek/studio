# studio

Portfólio de landing pages, vídeos e criativos para marcas. Site estático em HTML, CSS e JavaScript puros, publicado pelo GitHub Pages em `/studio/`. Não há build nem dependências: basta editar os arquivos e enviar.

## Estrutura

```
index.html            página única
assets/css/style.css  estilos
assets/js/data.js     lista de trabalhos (o único arquivo a editar no dia a dia)
assets/js/main.js     renderização e comportamento
assets/videos/        vídeos MP4
assets/images/        posters, prévias, criativos e og.jpg
assets/favicon.svg    ícone
.nojekyll             faz o GitHub Pages servir os arquivos como estão
```

## Adicionar um trabalho

Todos os trabalhos ficam em `assets/js/data.js`, dentro de `WORKS`. Copie um objeto da lista certa, cole onde quiser que ele apareça e troque os campos. A ordem no arquivo é a ordem na página.

### Vídeo

```js
{
  title: "Título do vídeo",
  client: "Nome do cliente",
  description: "Uma linha sobre a peça.",
  src: "assets/videos/nome-do-arquivo.mp4",
  poster: "assets/images/nome-do-arquivo-poster.jpg",
  placeholder: false
}
```

O vídeo toca sem som, em loop, só quando está visível na tela, e tem um botão para pausar. Quando há um único vídeo, ele aparece em destaque, com o texto ao lado; a partir de dois, vira grade.

### Landing page

```js
{
  title: "Landing page para clínica",
  segment: "Saúde",
  url: "../lp-clinica/",
  image: "assets/images/lp-clinica.jpg",
  placeholder: false
}
```

`url` é relativo ao domínio: `../lp-clinica/` aponta para o repositório `lp-clinica` publicado no mesmo usuário do GitHub Pages. O link abre em nova aba.

A imagem deve ser uma captura da página inteira (largura de 1440 px, altura livre). No computador, ao passar o mouse, a prévia rola de cima a baixo mostrando a página.

### Criativo

```js
{
  caption: "Carrossel de lançamento",
  format: "carrossel",          // "post" (4:5), "carrossel" (1:1) ou "story" (9:16)
  image: "assets/images/nome-do-arquivo.jpg",
  alt: "Descrição do que aparece na imagem",
  placeholder: false
}
```

### Itens reservados ("Em breve")

Itens com `placeholder: true` só aparecem quando a primeira linha do `data.js` estiver assim:

```js
const SHOW_PLACEHOLDERS = true;
```

Com `false` (padrão), eles não são exibidos, e uma categoria sem nenhum item real some da página, inclusive do menu. Use `true` só para ver o layout completo.

Se um arquivo de vídeo ou imagem não existir ou não carregar, o card mostra "Em breve" no lugar da mídia, em vez de um elemento quebrado.

## Arquivos de mídia

| Tipo | Pasta | Formato recomendado |
|---|---|---|
| Vídeo | `assets/videos/` | MP4 H.264, 1080×1920, sem áudio, de preferência abaixo de 8 MB |
| Poster do vídeo | `assets/images/` | JPG 1080×1920 (ou 720×1280), primeiro quadro ou quadro marcante |
| Prévia de landing page | `assets/images/` | JPG com 1440 px de largura, página inteira |
| Criativo | `assets/images/` | JPG ou WebP: post 1080×1350, carrossel 1080×1080, story 1080×1920 |
| Imagem de compartilhamento | `assets/images/og.jpg` | JPG 1200×630 |

Use nomes de arquivo em minúsculas, sem acentos nem espaços (ex.: `aromas-albore.mp4`).

### Comprimir vídeos com ffmpeg

```bash
ffmpeg -i entrada.mov \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 26 -preset slow \
  -an -movflags +faststart \
  assets/videos/nome-do-arquivo.mp4
```

- `-crf 26` controla a qualidade: suba para 28 se o arquivo passar de 8 MB, desça para 23 se aparecerem artefatos.
- `-an` remove o áudio (o vídeo toca mudo no site). Tire essa opção se quiser manter o som.
- `-movflags +faststart` permite começar a tocar antes de baixar o arquivo inteiro.

Gerar o poster a partir de um quadro do vídeo (aqui, no segundo 1):

```bash
ffmpeg -ss 1 -i assets/videos/nome-do-arquivo.mp4 -frames:v 1 -q:v 3 assets/images/nome-do-arquivo-poster.jpg
```

## Testar localmente

O site usa caminhos relativos e é publicado em `/studio/`. Para simular isso, sirva a pasta **acima** do repositório:

```bash
cd ..
python3 -m http.server 8000
```

Depois abra `http://localhost:8000/studio/`.

Para um teste rápido, também funciona rodar `python3 -m http.server 8000` dentro da pasta do repositório e abrir `http://localhost:8000/`.

## Publicar

```bash
git add .
git commit -m "Adiciona novo trabalho"
git push
```

O GitHub Pages atualiza o site em alguns minutos.
