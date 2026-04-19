import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const CURRENT_YEAR = new Date().getFullYear();

export function computeMetrics(node) {
  const m = node.metadata || {};
  const citations = m.citationCount || 0;
  const influential = m.influentialCitationCount || 0;
  const year = m.year || CURRENT_YEAR;
  const age = Math.max(CURRENT_YEAR - year + 1, 1);
  return {
    impactScore: citations + 2 * influential,
    citationDensity: Math.round(citations / age),
    recencyScore: CURRENT_YEAR - year,
    age,
  };
}

export const DUMMY_DATA = {
  nodes: [
    {
      id: 'paper_attention',
      type: 'paper',
      label: 'Attention Is All You Need',
      metadata: {
        title: 'Attention Is All You Need',
        authors: [
          { authorId: 'a1', name: 'Ashish Vaswani' },
          { authorId: 'a2', name: 'Noam M. Shazeer' },
          { authorId: 'a3', name: 'Niki Parmar' },
          { authorId: 'a4', name: 'Jakob Uszkoreit' },
        ],
        year: 2017,
        publicationDate: '2017-06-12',
        venue: 'Neural Information Processing Systems',
        publicationVenue: { name: 'NeurIPS', type: 'conference' },
        citationCount: 87000,
        influentialCitationCount: 12000,
        referenceCount: 34,
        abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose the Transformer, a model architecture based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
        tldr: { text: 'The Transformer model architecture relies entirely on attention mechanisms, achieving state-of-the-art on translation tasks while being more parallelizable than recurrent models.' },
        fieldsOfStudy: ['Computer Science', 'Machine Learning'],
        isOpenAccess: true,
        openAccessPdf: { url: 'https://arxiv.org/pdf/1706.03762.pdf' },
        arxivId: '1706.03762',
      },
    },
    {
      id: 'paper_bert',
      type: 'paper',
      label: 'BERT',
      metadata: {
        title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
        authors: [
          { authorId: 'a5', name: 'Jacob Devlin' },
          { authorId: 'a6', name: 'Ming-Wei Chang' },
          { authorId: 'a7', name: 'Kenton Lee' },
          { authorId: 'a8', name: 'Kristina Toutanova' },
        ],
        year: 2019,
        publicationDate: '2019-06-02',
        venue: 'NAACL',
        publicationVenue: { name: 'NAACL', type: 'conference' },
        citationCount: 62000,
        influentialCitationCount: 9800,
        referenceCount: 51,
        abstract: 'We introduce BERT, designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
        tldr: { text: 'BERT pre-trains deep bidirectional representations by conditioning on both left and right context, achieving state-of-the-art results on eleven NLP tasks.' },
        fieldsOfStudy: ['Computer Science', 'NLP'],
        isOpenAccess: true,
        openAccessPdf: { url: 'https://arxiv.org/pdf/1810.04805.pdf' },
        arxivId: '1810.04805',
      },
    },
    {
      id: 'paper_gpt3',
      type: 'paper',
      label: 'GPT-3',
      metadata: {
        title: 'Language Models are Few-Shot Learners',
        authors: [
          { authorId: 'a9', name: 'Tom B. Brown' },
          { authorId: 'a10', name: 'Benjamin Mann' },
          { authorId: 'a11', name: 'Nick Ryder' },
        ],
        year: 2020,
        publicationDate: '2020-05-28',
        venue: 'NeurIPS',
        publicationVenue: { name: 'NeurIPS', type: 'conference' },
        citationCount: 28000,
        influentialCitationCount: 4200,
        referenceCount: 87,
        abstract: 'GPT-3, with 175B parameters, achieves strong performance on many NLP benchmarks with few-shot learning, sometimes matching fine-tuned models.',
        tldr: { text: 'GPT-3 demonstrates that scaling language model parameters to 175B enables strong few-shot performance across diverse NLP tasks without gradient updates.' },
        fieldsOfStudy: ['Computer Science', 'NLP'],
        isOpenAccess: false,
        openAccessPdf: null,
        arxivId: '2005.14165',
      },
    },
    {
      id: 'paper_vit',
      type: 'paper',
      label: 'Vision Transformer (ViT)',
      metadata: {
        title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale',
        authors: [
          { authorId: 'a12', name: 'Alexey Dosovitskiy' },
          { authorId: 'a13', name: 'Lucas Beyer' },
          { authorId: 'a14', name: 'Alexander Kolesnikov' },
        ],
        year: 2021,
        publicationDate: '2021-06-03',
        venue: 'ICLR',
        publicationVenue: { name: 'ICLR', type: 'conference' },
        citationCount: 18000,
        influentialCitationCount: 3100,
        referenceCount: 45,
        abstract: 'We apply a pure transformer directly to sequences of image patches and find it performs very well on image classification tasks when pre-trained on large amounts of data.',
        tldr: { text: 'Applying Transformers directly to image patches achieves excellent results on image classification without convolutions when trained at scale.' },
        fieldsOfStudy: ['Computer Science', 'Computer Vision'],
        isOpenAccess: true,
        openAccessPdf: { url: 'https://arxiv.org/pdf/2010.11929.pdf' },
        arxivId: '2010.11929',
      },
    },
    {
      id: 'paper_clip',
      type: 'paper',
      label: 'CLIP',
      metadata: {
        title: 'Learning Transferable Visual Models From Natural Language Supervision',
        authors: [
          { authorId: 'a15', name: 'Alec Radford' },
          { authorId: 'a16', name: 'Jong Wook Kim' },
          { authorId: 'a17', name: 'Chris Hallacy' },
        ],
        year: 2021,
        publicationDate: '2021-02-26',
        venue: 'ICML',
        publicationVenue: { name: 'ICML', type: 'conference' },
        citationCount: 14000,
        influentialCitationCount: 2900,
        referenceCount: 62,
        abstract: 'CLIP trains image and text encoders jointly on 400M image-text pairs, enabling zero-shot transfer to diverse vision tasks via natural language prompts.',
        tldr: { text: 'CLIP achieves zero-shot transfer to diverse vision tasks by training jointly on 400M image-text pairs from the internet.' },
        fieldsOfStudy: ['Computer Science', 'Computer Vision', 'NLP'],
        isOpenAccess: true,
        openAccessPdf: { url: 'https://arxiv.org/pdf/2103.00020.pdf' },
        arxivId: '2103.00020',
      },
    },
    {
      id: 'paper_llama',
      type: 'paper',
      label: 'LLaMA',
      metadata: {
        title: 'LLaMA: Open and Efficient Foundation Language Models',
        authors: [
          { authorId: 'a18', name: 'Hugo Touvron' },
          { authorId: 'a19', name: 'Thibaut Lavril' },
          { authorId: 'a20', name: 'Gautier Izacard' },
        ],
        year: 2023,
        publicationDate: '2023-02-27',
        venue: 'arXiv',
        publicationVenue: { name: 'arXiv', type: 'repository' },
        citationCount: 8000,
        influentialCitationCount: 1400,
        referenceCount: 58,
        abstract: 'LLaMA is a collection of foundation language models from 7B to 65B parameters, trained on publicly available datasets. The 13B model outperforms GPT-3 on most benchmarks.',
        tldr: { text: 'LLaMA shows foundation models can reach state-of-the-art performance using only publicly available data, with 13B outperforming GPT-3.' },
        fieldsOfStudy: ['Computer Science', 'NLP'],
        isOpenAccess: true,
        openAccessPdf: { url: 'https://arxiv.org/pdf/2302.13971.pdf' },
        arxivId: '2302.13971',
      },
    },
    {
      id: 'paper_diffusion',
      type: 'paper',
      label: 'Denoising Diffusion',
      metadata: {
        title: 'Denoising Diffusion Probabilistic Models',
        authors: [
          { authorId: 'a21', name: 'Jonathan Ho' },
          { authorId: 'a22', name: 'Ajay Jain' },
          { authorId: 'a23', name: 'Pieter Abbeel' },
        ],
        year: 2020,
        publicationDate: '2020-06-19',
        venue: 'NeurIPS',
        publicationVenue: { name: 'NeurIPS', type: 'conference' },
        citationCount: 9500,
        influentialCitationCount: 1800,
        referenceCount: 42,
        abstract: 'We present high quality image synthesis results using diffusion probabilistic models, generating images using a Markov chain of diffusion steps.',
        tldr: { text: 'Diffusion probabilistic models generate high quality images through a learned reverse Markov chain, matching or exceeding GAN quality.' },
        fieldsOfStudy: ['Computer Science', 'Computer Vision'],
        isOpenAccess: true,
        openAccessPdf: { url: 'https://arxiv.org/pdf/2006.11239.pdf' },
        arxivId: '2006.11239',
      },
    },
    {
      id: 'paper_resnet',
      type: 'paper',
      label: 'Deep Residual Learning',
      metadata: {
        title: 'Deep Residual Learning for Image Recognition',
        authors: [
          { authorId: 'a24', name: 'Kaiming He' },
          { authorId: 'a25', name: 'Xiangyu Zhang' },
          { authorId: 'a26', name: 'Shaoqing Ren' },
          { authorId: 'a27', name: 'Jian Sun' },
        ],
        year: 2016,
        publicationDate: '2016-06-27',
        venue: 'CVPR',
        publicationVenue: { name: 'CVPR', type: 'conference' },
        citationCount: 120000,
        influentialCitationCount: 18000,
        referenceCount: 39,
        abstract: 'We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.',
        tldr: { text: 'Residual connections enable training very deep networks (152 layers), winning ILSVRC 2015 image classification by a large margin.' },
        fieldsOfStudy: ['Computer Science', 'Computer Vision'],
        isOpenAccess: true,
        openAccessPdf: { url: 'https://arxiv.org/pdf/1512.03385.pdf' },
        arxivId: '1512.03385',
      },
    },
    {
      id: 'author_vaswani',
      type: 'author',
      label: 'Ashish Vaswani',
      metadata: {
        authorId: 'a1',
        name: 'Ashish Vaswani',
        paperCount: 24,
        citationCount: 95000,
        hIndex: 18,
        affiliations: ['Google Brain', 'Google Research'],
        fieldsOfStudy: ['Machine Learning', 'NLP'],
      },
    },
    {
      id: 'author_devlin',
      type: 'author',
      label: 'Jacob Devlin',
      metadata: {
        authorId: 'a5',
        name: 'Jacob Devlin',
        paperCount: 18,
        citationCount: 68000,
        hIndex: 15,
        affiliations: ['Google Research'],
        fieldsOfStudy: ['NLP', 'Machine Learning'],
      },
    },
    {
      id: 'author_he',
      type: 'author',
      label: 'Kaiming He',
      metadata: {
        authorId: 'a24',
        name: 'Kaiming He',
        paperCount: 32,
        citationCount: 145000,
        hIndex: 22,
        affiliations: ['Meta AI', 'Microsoft Research'],
        fieldsOfStudy: ['Computer Vision', 'Deep Learning'],
      },
    },
    {
      id: 'model_transformer',
      type: 'model',
      label: 'Transformer',
      metadata: { task: 'Sequence Transduction', framework: 'PyTorch', paramCount: '65M' },
    },
    {
      id: 'model_bert_base',
      type: 'model',
      label: 'BERT-Base',
      metadata: { task: 'NLP / Language Understanding', framework: 'TensorFlow / PyTorch', paramCount: '110M' },
    },
    {
      id: 'model_gpt3_model',
      type: 'model',
      label: 'GPT-3 (175B)',
      metadata: { task: 'Language Generation', framework: 'Internal', paramCount: '175B' },
    },
    {
      id: 'model_vit_model',
      type: 'model',
      label: 'ViT-L/16',
      metadata: { task: 'Image Classification', framework: 'JAX', paramCount: '307M' },
    },
    {
      id: 'model_clip_model',
      type: 'model',
      label: 'CLIP ViT-B/32',
      metadata: { task: 'Vision-Language', framework: 'PyTorch', paramCount: '151M' },
    },
    {
      id: 'model_unet',
      type: 'model',
      label: 'U-Net',
      metadata: { task: 'Image Generation / Segmentation', framework: 'PyTorch', paramCount: '32M' },
    },
    {
      id: 'model_resnet50',
      type: 'model',
      label: 'ResNet-50',
      metadata: { task: 'Image Classification', framework: 'PyTorch / TensorFlow', paramCount: '25M' },
    },
    {
      id: 'ds_wmt',
      type: 'dataset',
      label: 'WMT 2014',
      metadata: { task: 'Machine Translation', size: '4.5M sentence pairs' },
    },
    {
      id: 'ds_glue',
      type: 'dataset',
      label: 'GLUE Benchmark',
      metadata: { task: 'NLP Benchmarking', size: '~200K examples' },
    },
    {
      id: 'ds_bookcorpus',
      type: 'dataset',
      label: 'BooksCorpus',
      metadata: { task: 'Language Modeling', size: '800M words' },
    },
    {
      id: 'ds_imagenet',
      type: 'dataset',
      label: 'ImageNet',
      metadata: { task: 'Image Classification', size: '1.28M images' },
    },
    {
      id: 'ds_jft',
      type: 'dataset',
      label: 'JFT-300M',
      metadata: { task: 'Image Classification', size: '300M images' },
    },
    {
      id: 'ds_laion',
      type: 'dataset',
      label: 'LAION-400M',
      metadata: { task: 'Vision-Language', size: '400M image-text pairs' },
    },
    {
      id: 'ds_pile',
      type: 'dataset',
      label: 'The Pile',
      metadata: { task: 'Language Modeling', size: '825 GB text' },
    },
    {
      id: 'ds_cifar',
      type: 'dataset',
      label: 'CIFAR-10',
      metadata: { task: 'Image Classification', size: '60K images' },
    },
  ],
  edges: [
    { id: 'e1',  source: 'paper_attention', target: 'model_transformer', type: 'uses_model' },
    { id: 'e2',  source: 'paper_attention', target: 'ds_wmt',            type: 'uses_dataset' },
    { id: 'e3',  source: 'paper_bert',      target: 'model_bert_base',   type: 'uses_model' },
    { id: 'e4',  source: 'paper_bert',      target: 'model_transformer', type: 'uses_model' },
    { id: 'e5',  source: 'paper_bert',      target: 'ds_glue',           type: 'uses_dataset' },
    { id: 'e6',  source: 'paper_bert',      target: 'ds_bookcorpus',     type: 'uses_dataset' },
    { id: 'e7',  source: 'paper_gpt3',      target: 'model_gpt3_model',  type: 'uses_model' },
    { id: 'e8',  source: 'paper_gpt3',      target: 'ds_pile',           type: 'uses_dataset' },
    { id: 'e9',  source: 'paper_gpt3',      target: 'ds_bookcorpus',     type: 'uses_dataset' },
    { id: 'e10', source: 'paper_vit',       target: 'model_vit_model',   type: 'uses_model' },
    { id: 'e11', source: 'paper_vit',       target: 'ds_imagenet',       type: 'uses_dataset' },
    { id: 'e12', source: 'paper_vit',       target: 'ds_jft',            type: 'uses_dataset' },
    { id: 'e13', source: 'paper_clip',      target: 'model_clip_model',  type: 'uses_model' },
    { id: 'e14', source: 'paper_clip',      target: 'ds_laion',          type: 'uses_dataset' },
    { id: 'e15', source: 'paper_clip',      target: 'ds_imagenet',       type: 'uses_dataset' },
    { id: 'e16', source: 'paper_llama',     target: 'ds_pile',           type: 'uses_dataset' },
    { id: 'e17', source: 'paper_llama',     target: 'ds_bookcorpus',     type: 'uses_dataset' },
    { id: 'e18', source: 'paper_llama',     target: 'model_transformer', type: 'uses_model' },
    { id: 'e19', source: 'paper_diffusion', target: 'model_unet',        type: 'uses_model' },
    { id: 'e20', source: 'paper_diffusion', target: 'ds_cifar',          type: 'uses_dataset' },
    { id: 'e21', source: 'paper_diffusion', target: 'ds_imagenet',       type: 'uses_dataset' },
    { id: 'e22', source: 'paper_vit',       target: 'ds_cifar',          type: 'uses_dataset' },
    { id: 'e23', source: 'paper_resnet',    target: 'model_resnet50',    type: 'uses_model' },
    { id: 'e24', source: 'paper_resnet',    target: 'ds_imagenet',       type: 'uses_dataset' },
    { id: 'e25', source: 'paper_bert',      target: 'paper_attention',   type: 'cites' },
    { id: 'e26', source: 'paper_vit',       target: 'paper_attention',   type: 'cites' },
    { id: 'e27', source: 'paper_llama',     target: 'paper_attention',   type: 'cites' },
    { id: 'e28', source: 'paper_attention', target: 'author_vaswani',    type: 'written_by' },
    { id: 'e29', source: 'paper_bert',      target: 'author_devlin',     type: 'written_by' },
    { id: 'e30', source: 'paper_resnet',    target: 'author_he',         type: 'written_by' },
    { id: 'e31', source: 'paper_clip',      target: 'model_vit_model',   type: 'uses_model' },
    { id: 'e32', source: 'paper_gpt3',      target: 'paper_bert',        type: 'cites' },
  ],
  meta: { total_results: 25 },
};

export function normalizeGraphData(graph) {
  const nodes = Array.isArray(graph?.nodes)
    ? graph.nodes.map((node) => ({
        ...node,
        type: node?.type || 'paper',
        label: node?.label || node?.id || 'Unknown',
        metadata: node?.metadata || {},
      }))
    : [];

  const edges = Array.isArray(graph?.edges)
    ? graph.edges
        .map((edge, index) => ({
          ...edge,
          id: edge?.id || `edge_${index}`,
          source: typeof edge?.source === 'object' ? edge.source.id : edge?.source,
          target: typeof edge?.target === 'object' ? edge.target.id : edge?.target,
          type: normalizeEdgeType(edge?.type),
        }))
        .filter((edge) => edge.source && edge.target)
    : [];

  return { nodes, edges };
}

export function normalizeEdgeType(edgeType) {
  const t = String(edgeType || '').toLowerCase();
  if (t === 'uses_model') return 'uses_model';
  if (t === 'uses_dataset') return 'uses_dataset';
  if (t === 'cites') return 'cites';
  if (t === 'written_by') return 'written_by';
  return 'connected_to';
}

export async function searchGraph({ query, yearFrom, yearTo, sortBy, order } = {}) {
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (yearFrom) params.set('year_from', yearFrom);
  if (yearTo) params.set('year_to', yearTo);
  if (sortBy) params.set('sort_by', sortBy);
  if (order) params.set('order', order);

  const response = await axios.post(
    `${API_BASE_URL}/search/?${params.toString()}`,
    {},
    { timeout: 0 }
  );
  return response.data;
}

export function getSimilarPapers(paperId, graphData) {
  const myConnections = new Set(
    graphData.edges
      .filter((e) => e.source === paperId || e.target === paperId)
      .map((e) => (e.source === paperId ? e.target : e.source))
  );

  const scores = {};
  graphData.nodes
    .filter((n) => n.type === 'paper' && n.id !== paperId)
    .forEach((other) => {
      const otherConnections = new Set(
        graphData.edges
          .filter((e) => e.source === other.id || e.target === other.id)
          .map((e) => (e.source === other.id ? e.target : e.source))
      );
      const shared = [...myConnections].filter((id) => otherConnections.has(id)).length;
      if (shared > 0) scores[other.id] = shared;
    });

  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, score]) => ({ node: graphData.nodes.find((n) => n.id === id), score }))
    .filter((r) => r.node);
}

export function exportCSV(graphData) {
  const rows = [['id', 'type', 'label', 'year', 'citationCount', 'influentialCitationCount', 'venue', 'arxivId']];
  graphData.nodes.forEach((n) => {
    const m = n.metadata || {};
    rows.push([
      n.id, n.type,
      `"${(n.label || '').replace(/"/g, '""')}"`,
      m.year || '',
      m.citationCount || '',
      m.influentialCitationCount || '',
      `"${(m.venue || '').replace(/"/g, '""')}"`,
      m.arxivId || '',
    ]);
  });
  return rows.map((r) => r.join(',')).join('\n');
}
