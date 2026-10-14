/*
 * Conteúdo do portfólio.
 * Para adicionar um trabalho, copie um objeto da lista correspondente e edite os campos.
 * Caminhos de arquivos são relativos à raiz do site (ex.: "assets/videos/nome.mp4").
 *
 * placeholder: true  -> item reservado ("Em breve"). Só aparece com SHOW_PLACEHOLDERS = true.
 */

/* true mostra os itens reservados, para visualizar o layout completo. */
const SHOW_PLACEHOLDERS = false;

const WORKS = {
  /* Vídeos verticais 9:16.
   * Campos: title, client, description, src (MP4), poster (JPG), placeholder
   * gallery (opcional): imagens 16:9 exibidas abaixo do vídeo, que abrem em tela cheia.
   *   [{ src: "assets/images/nome.jpg", alt: "o que aparece na imagem", caption: "legenda" }] */
  videos: [
    {
      title: "Vídeo comercial animado para Reels e Stories",
      client: "Aromas Alboré",
      description: "Peça animada em formato vertical, pensada para o ritmo dos Reels e Stories.",
      src: "assets/videos/aromas-albore.mp4",
      poster: "assets/images/aromas-albore-poster.jpg",
      gallery: [
        {
          src: "assets/images/aromas-historia.jpg",
          alt: "Quatro telas do vídeo lado a lado: logotipo da Aromas Alboré, frascos do aromatizador, os quatro aromas da coleção e a chamada final para pedido",
          caption: "Estrutura do vídeo: marca, produto, coleção e chamada."
        },
        {
          src: "assets/images/aromas-colecao.jpg",
          alt: "Quatro telas da coleção, uma por aroma, cada uma com cores próprias: Lavanda Citrus, Ocean Waves, Vila Romana e Vanilla Vetiver",
          caption: "Um sistema visual com uma cena para cada aroma."
        }
      ],
      placeholder: false
    },
    {
      title: "Reels de dica: ansiedade no dia a dia",
      client: "Projeto conceitual · Clínica Serena",
      description: "Os três Reels da Clínica Serena saíram do mesmo template em Remotion: só os textos mudam, e a duração se ajusta sozinha ao ritmo de leitura.",
      src: "assets/videos/serena-dica.mp4",
      poster: "assets/images/serena-dica-poster.jpg",
      placeholder: false
    },
    {
      title: "Reels mito × verdade sobre terapia",
      client: "Projeto conceitual · Clínica Serena",
      description: "Os três Reels da Clínica Serena saíram do mesmo template em Remotion: só os textos mudam, e a duração se ajusta sozinha ao ritmo de leitura.",
      src: "assets/videos/serena-mito.mp4",
      poster: "assets/images/serena-mito-poster.jpg",
      placeholder: false
    },
    {
      title: "Reels de convite para a primeira conversa",
      client: "Projeto conceitual · Clínica Serena",
      description: "Os três Reels da Clínica Serena saíram do mesmo template em Remotion: só os textos mudam, e a duração se ajusta sozinha ao ritmo de leitura.",
      src: "assets/videos/serena-convite.mp4",
      poster: "assets/images/serena-convite-poster.jpg",
      placeholder: false
    },
    {
      title: "Vídeo para anúncio",
      client: "Próximo projeto",
      description: "Espaço reservado para um novo trabalho.",
      placeholder: true
    },
    {
      title: "Vídeo para Reels",
      client: "Próximo projeto",
      description: "Espaço reservado para um novo trabalho.",
      placeholder: true
    }
  ],

  /* Landing pages.
   * Campos: title, segment, url (abre em nova aba), image (captura da página inteira,
   * largura 1440px; a prévia rola ao passar o mouse), placeholder */
  landingPages: [
    {
      title: "Landing page para clínica",
      segment: "Projeto conceitual · Saúde",
      url: "../lp-clinica/",
      image: "assets/images/lp-clinica.jpg",
      placeholder: false
    },
    {
      title: "Landing page para SaaS",
      segment: "Software",
      url: "../lp-saas/",
      image: "assets/images/lp-saas.jpg",
      placeholder: true
    }
  ],

  /* Criativos para redes sociais.
   * Campos: caption, format ("post" 4:5, "carrossel" 1:1, "story" 9:16), image, alt, placeholder */
  criativos: [
    {
      caption: "Post para feed",
      format: "post",
      placeholder: true
    },
    {
      caption: "Carrossel",
      format: "carrossel",
      placeholder: true
    },
    {
      caption: "Story",
      format: "story",
      placeholder: true
    }
  ]
};
