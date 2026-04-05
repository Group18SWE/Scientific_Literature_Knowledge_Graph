import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
// ─────────────────────────────────────────────
//  DATA FORMAT (what the graph function expects)
// ─────────────────────────────────────────────
//
//  interface GraphNode {
//    id: string;                       // unique stable ID (e.g. "paper_1234", "model_bert", "ds_imagenet")
//    type: "paper" | "model" | "dataset";
//    label: string;                    // short display name shown on canvas
//    metadata: {
//      // PAPER fields
//      title?: string;                 // full title
//      authors?: string[] | { authorId?: string; name: string }[];
//      year?: number;
//      publicationDate?: string;       // e.g. "2017-06-12"
//      venue?: string;                 // e.g. "Neural Information Processing Systems"
//      publicationVenue?: { name: string; type?: string; alternate_names?: string[]; id?: string | null };
//      journal?: { name: string; volume?: string };
//      publicationTypes?: string[];
//      arxivId?: string;
//      semanticScholarId?: string;
//      abstract?: string;
//      tldr?: { text: string; model?: string };
//      citationCount?: number;
//      influentialCitationCount?: number;
//      referenceCount?: number;
//      fieldsOfStudy?: string[];
//      isOpenAccess?: boolean;
//      openAccessPdf?: { url: string; status?: string; license?: string } | null;
//      
//      // MODEL fields
//      framework?: string;             // e.g. "PyTorch", "JAX"
//      task?: string;                  // e.g. "Text Classification"
//      paramCount?: string;            // e.g. "340M"
//      pwcUrl?: string;                // Papers with Code URL
//      
//      // DATASET fields
//      size?: string;                  // e.g. "1.2M samples"
//      // task?: string;               // (shared with Model)
//      // pwcUrl?: string;             // (shared with Model)
//    }
//  }
//
//  interface GraphEdge {
//    id: string;                       // unique edge ID
//    source: string;                   // node id
//    target: string;                   // node id
//    type: "uses_model" | "uses_dataset";
//  }
//
//  interface GraphData {
//    nodes: GraphNode[];
//    edges: GraphEdge[];
//  }

// ─────────────────────────────────────────────
//  DUMMY DATA
// ─────────────────────────────────────────────
const DUMMY_DATA = {
  nodes: [
    // * Papers — Semantic Scholar schema
    {
      id: "paper_attention",
      type: "paper",
      label: "Attention Is All You Need",
      metadata: {
        //* ── Core identity ──────────────────────────────────────
        paperId: "204e3073870fae3d05bcbc2f6a8e263d9b72e776",
        corpusId: 13756489,
        externalIds: { MAG: "2963403868", ArXiv: "1706.03762", DBLP: "journals/corr/VaswaniSPUJGKP17", DOI: "10.5555/3295222.3295349", CorpusId: 13756489 },
        url: "https://www.semanticscholar.org/paper/204e3073870fae3d05bcbc2f6a8e263d9b72e776",
        //* ── Bibliographic ──────────────────────────────────────
        title: "Attention Is All You Need",
        authors: [
          { authorId: "40348417", name: "Ashish Vaswani" },
          { authorId: "2566211",  name: "Noam M. Shazeer" },
          { authorId: "1701686",  name: "Niki Parmar" },
          { authorId: "39328010", name: "Jakob Uszkoreit" },
        ],
        year: 2017,
        publicationDate: "2017-06-12",
        venue: "Neural Information Processing Systems",
        publicationVenue: { id: "d9720b90-d60b-48bc-9df8-87a30b9a60dd", name: "Neural Information Processing Systems", type: "conference", alternate_names: ["NeurIPS", "NIPS"] },
        journal: { name: "ArXiv", volume: "abs/1706.03762" },
        publicationTypes: ["JournalArticle", "Conference"],
        //* ── Metrics ────────────────────────────────────────────
        citationCount: 87000,
        referenceCount: 34,
        influentialCitationCount: 12000,
        //* ── Content ────────────────────────────────────────────
        abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
        tldr: { model: "tldr@v2.0.0", text: "The Transformer model architecture relies entirely on attention mechanisms, achieving state-of-the-art on translation tasks while being more parallelizable than recurrent models." },
        fieldsOfStudy: ["Computer Science"],
        s2FieldsOfStudy: [{ category: "Computer Science", source: "external" }, { category: "Computer Science", source: "s2-fos-model" }],
        //* ── Access ─────────────────────────────────────────────
        isOpenAccess: true,
        openAccessPdf: { url: "https://arxiv.org/pdf/1706.03762.pdf", status: "GREEN", license: "ARXIV" },
        //* ── Identifiers ────────────────────────────────────────
        arxivId: "1706.03762",
        semanticScholarId: "204e3073870fae3d05bcbc2f6a8e263d9b72e776",
      },
    },
    {
      id: "paper_bert",
      type: "paper",
      label: "BERT",
      metadata: {
        paperId: "df2b0e26d0599ce3e70df8a9da02e51594e0e992",
        corpusId: 52967399,
        externalIds: { MAG: "2952867614", ArXiv: "1810.04805", DBLP: "conf/naacl/DevlinCLT19", DOI: "10.18653/v1/N19-1423", CorpusId: 52967399 },
        url: "https://www.semanticscholar.org/paper/df2b0e26d0599ce3e70df8a9da02e51594e0e992",
        title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
        authors: [
          { authorId: "1741101",  name: "Jacob Devlin" },
          { authorId: "143977260",name: "Ming-Wei Chang" },
          { authorId: "39328010", name: "Kenton Lee" },
          { authorId: "2826018",  name: "Kristina Toutanova" },
        ],
        year: 2019,
        publicationDate: "2019-06-02",
        venue: "North American Chapter of the Association for Computational Linguistics",
        publicationVenue: { id: "bdc2e585-4e48-4e36-8af1-6d859763d405", name: "NAACL", type: "conference", alternate_names: ["North American Chapter of the ACL"] },
        journal: { name: "ArXiv", volume: "abs/1810.04805" },
        publicationTypes: ["JournalArticle", "Conference"],
        citationCount: 62000,
        referenceCount: 51,
        influentialCitationCount: 9800,
        abstract: "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.",
        tldr: { model: "tldr@v2.0.0", text: "BERT pre-trains deep bidirectional representations by conditioning on both left and right context, achieving state-of-the-art results on eleven NLP tasks." },
        fieldsOfStudy: ["Computer Science"],
        s2FieldsOfStudy: [{ category: "Computer Science", source: "external" }],
        isOpenAccess: true,
        openAccessPdf: { url: "https://arxiv.org/pdf/1810.04805.pdf", status: "GREEN", license: "ARXIV" },
        arxivId: "1810.04805",
        semanticScholarId: "df2b0e26d0599ce3e70df8a9da02e51594e0e992",
      },
    },
    {
      id: "paper_gpt3",
      type: "paper",
      label: "GPT-3",
      metadata: {
        paperId: "6b85b63579a916f705a8e10a49bd8d849d91b1fc",
        corpusId: 218971783,
        externalIds: { MAG: "3038874545", ArXiv: "2005.14165", CorpusId: 218971783 },
        url: "https://www.semanticscholar.org/paper/6b85b63579a916f705a8e10a49bd8d849d91b1fc",
        title: "Language Models are Few-Shot Learners",
        authors: [
          { authorId: "1890027", name: "Tom B. Brown" },
          { authorId: "2060214", name: "Benjamin Mann" },
          { authorId: "3098870", name: "Nick Ryder" },
        ],
        year: 2020,
        publicationDate: "2020-05-28",
        venue: "Neural Information Processing Systems",
        publicationVenue: { id: "d9720b90-d60b-48bc-9df8-87a30b9a60dd", name: "Neural Information Processing Systems", type: "conference", alternate_names: ["NeurIPS"] },
        journal: { name: "ArXiv", volume: "abs/2005.14165" },
        publicationTypes: ["JournalArticle", "Conference"],
        citationCount: 28000,
        referenceCount: 87,
        influentialCitationCount: 4200,
        abstract: "We show that scaling language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches. GPT-3 has 175 billion parameters and achieves strong performance on many NLP benchmarks.",
        tldr: { model: "tldr@v2.0.0", text: "GPT-3 demonstrates that scaling language model parameters to 175B enables strong few-shot performance across diverse NLP tasks without any gradient updates." },
        fieldsOfStudy: ["Computer Science"],
        s2FieldsOfStudy: [{ category: "Computer Science", source: "external" }],
        isOpenAccess: false,
        openAccessPdf: null,
        arxivId: "2005.14165",
        semanticScholarId: "6b85b63579a916f705a8e10a49bd8d849d91b1fc",
      },
    },
    {
      id: "paper_vit",
      type: "paper",
      label: "Vision Transformer (ViT)",
      metadata: {
        paperId: "268d347e8a55b5eb82fb5e7d2f800e33c75ab18a",
        corpusId: 225039882,
        externalIds: { MAG: "3090847490", ArXiv: "2010.11929", DBLP: "conf/iclr/DosovitskiyB0WZ21", CorpusId: 225039882 },
        url: "https://www.semanticscholar.org/paper/268d347e8a55b5eb82fb5e7d2f800e33c75ab18a",
        title: "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale",
        authors: [
          { authorId: "2986529",  name: "Alexey Dosovitskiy" },
          { authorId: "1689647",  name: "Lucas Beyer" },
          { authorId: "1871568",  name: "Alexander Kolesnikov" },
        ],
        year: 2021,
        publicationDate: "2021-06-03",
        venue: "International Conference on Learning Representations",
        publicationVenue: { id: "fc0a208c-acb7-47dc-a0d4-af8190e21d29", name: "ICLR", type: "conference", alternate_names: ["International Conference on Learning Representations"] },
        journal: { name: "ArXiv", volume: "abs/2010.11929" },
        publicationTypes: ["JournalArticle", "Conference"],
        citationCount: 18000,
        referenceCount: 45,
        influentialCitationCount: 3100,
        abstract: "While the Transformer architecture has become the de-facto standard for natural language processing tasks, its applications to computer vision remain limited. We apply a pure transformer directly to sequences of image patches and find that it performs very well on image classification tasks when pre-trained on large amounts of data.",
        tldr: { model: "tldr@v2.0.0", text: "Applying Transformers directly to sequences of image patches achieves excellent results on image classification without any convolutions when trained at scale." },
        fieldsOfStudy: ["Computer Science"],
        s2FieldsOfStudy: [{ category: "Computer Science", source: "external" }],
        isOpenAccess: true,
        openAccessPdf: { url: "https://arxiv.org/pdf/2010.11929.pdf", status: "GREEN", license: "ARXIV" },
        arxivId: "2010.11929",
        semanticScholarId: "268d347e8a55b5eb82fb5e7d2f800e33c75ab18a",
      },
    },
    {
      id: "paper_clip",
      type: "paper",
      label: "CLIP",
      metadata: {
        paperId: "6f870f7f02a8c59c3e23f407f3ef00dd1dcf8fc4",
        corpusId: 231591445,
        externalIds: { MAG: "3136849575", ArXiv: "2103.00020", DBLP: "conf/icml/RadfordKHRGASAM21", CorpusId: 231591445 },
        url: "https://www.semanticscholar.org/paper/6f870f7f02a8c59c3e23f407f3ef00dd1dcf8fc4",
        title: "Learning Transferable Visual Models From Natural Language Supervision",
        authors: [
          { authorId: "2078135",  name: "Alec Radford" },
          { authorId: "39139825", name: "Jong Wook Kim" },
          { authorId: "2085684",  name: "Chris Hallacy" },
        ],
        year: 2021,
        publicationDate: "2021-02-26",
        venue: "International Conference on Machine Learning",
        publicationVenue: { id: "fc2b9af8-8b59-49be-bf0c-c7d0427e9138", name: "ICML", type: "conference", alternate_names: ["International Conference on Machine Learning"] },
        journal: { name: "ArXiv", volume: "abs/2103.00020" },
        publicationTypes: ["JournalArticle", "Conference"],
        citationCount: 14000,
        referenceCount: 62,
        influentialCitationCount: 2900,
        abstract: "State-of-the-art computer vision systems are trained to predict a fixed set of predetermined object categories. We show that it is possible to achieve similar performance by directly training models with natural language supervision on a dataset of 400M image-text pairs.",
        tldr: { model: "tldr@v2.0.0", text: "CLIP trains image and text encoders jointly on 400M image-text pairs, enabling zero-shot transfer to diverse vision tasks via natural language prompts." },
        fieldsOfStudy: ["Computer Science"],
        s2FieldsOfStudy: [{ category: "Computer Science", source: "external" }],
        isOpenAccess: true,
        openAccessPdf: { url: "https://arxiv.org/pdf/2103.00020.pdf", status: "GREEN", license: "ARXIV" },
        arxivId: "2103.00020",
        semanticScholarId: "6f870f7f02a8c59c3e23f407f3ef00dd1dcf8fc4",
      },
    },
    {
      id: "paper_llama",
      type: "paper",
      label: "LLaMA",
      metadata: {
        paperId: "57e849d0de13ed5f91d086936296721d4ff75a75",
        corpusId: 257219404,
        externalIds: { MAG: "4372428023", ArXiv: "2302.13971", CorpusId: 257219404 },
        url: "https://www.semanticscholar.org/paper/57e849d0de13ed5f91d086936296721d4ff75a75",
        title: "LLaMA: Open and Efficient Foundation Language Models",
        authors: [
          { authorId: "2009065",  name: "Hugo Touvron" },
          { authorId: "1786169",  name: "Thibaut Lavril" },
          { authorId: "2060214",  name: "Gautier Izacard" },
        ],
        year: 2023,
        publicationDate: "2023-02-27",
        venue: "arXiv.org",
        publicationVenue: { id: null, name: "arXiv", type: "repository" },
        journal: { name: "ArXiv", volume: "abs/2302.13971" },
        publicationTypes: ["JournalArticle"],
        citationCount: 8000,
        referenceCount: 58,
        influentialCitationCount: 1400,
        abstract: "We introduce LLaMA, a collection of foundation language models ranging from 7B to 65B parameters. We train our models on trillions of tokens, and show that it is possible to train state-of-the-art models using publicly available datasets exclusively.",
        tldr: { model: "tldr@v2.0.0", text: "LLaMA shows that foundation models can reach state-of-the-art performance using only publicly available data, with the 13B model outperforming GPT-3 on most benchmarks." },
        fieldsOfStudy: ["Computer Science"],
        s2FieldsOfStudy: [{ category: "Computer Science", source: "external" }],
        isOpenAccess: true,
        openAccessPdf: { url: "https://arxiv.org/pdf/2302.13971.pdf", status: "GREEN", license: "ARXIV" },
        arxivId: "2302.13971",
        semanticScholarId: "57e849d0de13ed5f91d086936296721d4ff75a75",
      },
    },
    {
      id: "model_transformer",
      type: "model",
      label: "Transformer",
      metadata: {
        task: "Sequence Transduction",
        framework: "PyTorch",
        paramCount: "65M",
        pwcUrl: "https://paperswithcode.com/method/transformer",
      },
    },
    {
      id: "model_bert_base",
      type: "model",
      label: "BERT-Base",
      metadata: {
        task: "NLP / Language Understanding",
        framework: "TensorFlow / PyTorch",
        paramCount: "110M",
        pwcUrl: "https://paperswithcode.com/method/bert",
      },
    },
    {
      id: "model_gpt3_model",
      type: "model",
      label: "GPT-3 (175B)",
      metadata: {
        task: "Language Generation",
        framework: "Internal",
        paramCount: "175B",
        pwcUrl: "https://paperswithcode.com/method/gpt-3",
      },
    },
    {
      id: "model_vit_model",
      type: "model",
      label: "ViT-L/16",
      metadata: {
        task: "Image Classification",
        framework: "JAX",
        paramCount: "307M",
        pwcUrl: "https://paperswithcode.com/method/vision-transformer",
      },
    },
    {
      id: "model_clip_model",
      type: "model",
      label: "CLIP ViT-B/32",
      metadata: {
        task: "Vision-Language",
        framework: "PyTorch",
        paramCount: "151M",
        pwcUrl: "https://paperswithcode.com/method/clip",
      },
    },
    {
      id: "ds_wmt",
      type: "dataset",
      label: "WMT 2014",
      metadata: {
        task: "Machine Translation",
        size: "4.5M sentence pairs",
        pwcUrl: "https://paperswithcode.com/dataset/wmt-2014",
      },
    },
    {
      id: "ds_glue",
      type: "dataset",
      label: "GLUE Benchmark",
      metadata: {
        task: "NLP Benchmarking",
        size: "~200K examples",
        pwcUrl: "https://paperswithcode.com/dataset/glue",
      },
    },
    {
      id: "ds_bookcorpus",
      type: "dataset",
      label: "BooksCorpus",
      metadata: {
        task: "Language Modeling",
        size: "800M words",
        pwcUrl: "https://paperswithcode.com/dataset/bookcorpus",
      },
    },
    {
      id: "ds_imagenet",
      type: "dataset",
      label: "ImageNet",
      metadata: {
        task: "Image Classification",
        size: "1.28M images",
        pwcUrl: "https://paperswithcode.com/dataset/imagenet",
      },
    },
    {
      id: "ds_jft",
      type: "dataset",
      label: "JFT-300M",
      metadata: {
        task: "Image Classification",
        size: "300M images",
        pwcUrl: "https://paperswithcode.com/dataset/jft-300m",
      },
    },
    {
      id: "ds_laion",
      type: "dataset",
      label: "LAION-400M",
      metadata: {
        task: "Vision-Language",
        size: "400M image-text pairs",
        pwcUrl: "https://paperswithcode.com/dataset/laion-400m",
      },
    },
    {
      id: "ds_pile",
      type: "dataset",
      label: "The Pile",
      metadata: {
        task: "Language Modeling",
        size: "825 GB text",
        pwcUrl: "https://paperswithcode.com/dataset/the-pile",
      },
    },
  ],
  edges: [
    { id: "e1", source: "paper_attention", target: "model_transformer", type: "uses_model" },
    { id: "e2", source: "paper_attention", target: "ds_wmt", type: "uses_dataset" },
    { id: "e3", source: "paper_bert", target: "model_bert_base", type: "uses_model" },
    { id: "e4", source: "paper_bert", target: "model_transformer", type: "uses_model" },
    { id: "e5", source: "paper_bert", target: "ds_glue", type: "uses_dataset" },
    { id: "e6", source: "paper_bert", target: "ds_bookcorpus", type: "uses_dataset" },
    { id: "e7", source: "paper_gpt3", target: "model_gpt3_model", type: "uses_model" },
    { id: "e8", source: "paper_gpt3", target: "ds_pile", type: "uses_dataset" },
    { id: "e9", source: "paper_gpt3", target: "ds_bookcorpus", type: "uses_dataset" },
    { id: "e10", source: "paper_vit", target: "model_vit_model", type: "uses_model" },
    { id: "e11", source: "paper_vit", target: "ds_imagenet", type: "uses_dataset" },
    { id: "e12", source: "paper_vit", target: "ds_jft", type: "uses_dataset" },
    { id: "e13", source: "paper_clip", target: "model_clip_model", type: "uses_model" },
    { id: "e14", source: "paper_clip", target: "ds_laion", type: "uses_dataset" },
    { id: "e15", source: "paper_clip", target: "ds_imagenet", type: "uses_dataset" },
    { id: "e16", source: "paper_llama", target: "ds_pile", type: "uses_dataset" },
    { id: "e17", source: "paper_llama", target: "ds_bookcorpus", type: "uses_dataset" },
    { id: "e18", source: "paper_llama", target: "model_transformer", type: "uses_model" },
  ],
};

//* ─────────────────────────────────────────────
//*  Theme definitions for nodes and edges
//* ─────────────────────────────────────────────
const NODE_CONFIG = {
  paper:   { color: "#38bdf8", glow: "#0ea5e9", radius: 18, shape: "circle" },
  model:   { color: "#f59e0b", glow: "#d97706", radius: 14, shape: "diamond" },
  dataset: { color: "#a78bfa", glow: "#7c3aed", radius: 14, shape: "rect" },
};

const EDGE_CONFIG = {
  uses_model:   { color: "#f59e0b44", width: 1.5 },
  uses_dataset: { color: "#a78bfa44", width: 1.5 },
};

//* Building an adjacency list from the edge array 
function buildAdjacency(edges) {
  const adj = new Map(); 
  edges.forEach((e) => {
    const src = typeof e.source === "object" ? e.source.id : e.source;
    const tgt = typeof e.target === "object" ? e.target.id : e.target;
    if (!adj.has(src)) adj.set(src, []);
    if (!adj.has(tgt)) adj.set(tgt, []);
    adj.get(src).push({ neighborId: tgt, edgeId: e.id });
    adj.get(tgt).push({ neighborId: src, edgeId: e.id });
  });
  return adj;
}

//* Utility function for BFS from startId:
//* returns ALL nodes and edges reachable in the connected component
function getSubgraph(startId, edges) {
  const adj = buildAdjacency(edges);
  const visitedNodes = new Set([startId]);
  const visitedEdges = new Set();
  const queue = [startId];

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = adj.get(current) || [];
    neighbors.forEach(({ neighborId, edgeId }) => {
      visitedEdges.add(edgeId);
      if (!visitedNodes.has(neighborId)) {
        visitedNodes.add(neighborId);
        queue.push(neighborId);
      }
    });
  }

  //* neighborIds = everything in the subgraph except the origin node itself
  const neighborIds = new Set([...visitedNodes].filter((id) => id !== startId));
  return { neighborIds, edgeIds: visitedEdges };
}

//* Derive year bounds from data so reset always matches the actual dataset
const ALL_YEARS = DUMMY_DATA.nodes
  .filter((n) => n.type === "paper" && n.metadata.year)
  .map((n) => n.metadata.year);
const DATA_MIN_YEAR = Math.min(...ALL_YEARS);
const DATA_MAX_YEAR = Math.max(...ALL_YEARS);

const DEFAULT_FILTERS = {
  paper: true,
  model: true,
  dataset: true,
  yearMin: DATA_MIN_YEAR,
  yearMax: DATA_MAX_YEAR,
  minCitations: 0,
};

export default function ResearchGraph() {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [searchQuery, setSearchQuery] = useState("");
  const [graphData, setGraphData] = useState(DUMMY_DATA);

  // Filtered data based on all active filters
  const filteredData = useCallback(() => {
    const query = searchQuery.toLowerCase();
    const visibleNodes = graphData.nodes.filter((n) => {
      if (!filters[n.type]) return false;
      if (query && !n.label.toLowerCase().includes(query) &&
          !(n.metadata.title || "").toLowerCase().includes(query)) return false;
      // Year range — only applies to paper nodes that have a year
      if (n.type === "paper" && n.metadata.year != null) {
        if (n.metadata.year < filters.yearMin || n.metadata.year > filters.yearMax) return false;
      }
      // Min citations — only applies to paper nodes that have citationCount
      if (n.type === "paper" && n.metadata.citationCount != null) {
        if (n.metadata.citationCount < filters.minCitations) return false;
      }
      return true;
    });
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = graphData.edges.filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
    );
    return { nodes: visibleNodes, edges: visibleEdges };
  }, [graphData, filters, searchQuery]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const container = svgRef.current.parentElement;
    const W = container.clientWidth;
    const H = container.clientHeight;

    svg.attr("width", W).attr("height", H);

    // Zoom layer
    const g = svg.append("g");

    const zoom = d3.zoom()
      .scaleExtent([0.15, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);

    // Defs: glows, arrowheads
    const defs = svg.append("defs");

    Object.entries(NODE_CONFIG).forEach(([type, cfg]) => {
      const filter = defs.append("filter").attr("id", `glow-${type}`).attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
      filter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "blur");
      const merge = filter.append("feMerge");
      merge.append("feMergeNode").attr("in", "blur");
      merge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    // Selected glow
    const selFilter = defs.append("filter").attr("id", "glow-selected").attr("x", "-100%").attr("y", "-100%").attr("width", "300%").attr("height", "300%");
    selFilter.append("feGaussianBlur").attr("stdDeviation", "8").attr("result", "blur");
    const selMerge = selFilter.append("feMerge");
    selMerge.append("feMergeNode").attr("in", "blur");
    selMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const { nodes, edges } = filteredData();
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Deep copy for D3 mutation
    const simNodes = nodes.map((n) => ({ ...n }));
    const simEdges = edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({ ...e }));

    // Force simulation
    const simulation = d3.forceSimulation(simNodes)
      .force("link", d3.forceLink(simEdges).id((d) => d.id).distance(120).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide().radius((d) => NODE_CONFIG[d.type].radius + 20));

    simulationRef.current = simulation;

    // Edges
    const linkGroup = g.append("g").attr("class", "links");
    const link = linkGroup
      .selectAll("line")
      .data(simEdges)
      .enter()
      .append("line")
      .attr("class", (d) => `edge edge-${d.id}`)
      .attr("stroke", (d) => EDGE_CONFIG[d.type].color)
      .attr("stroke-width", (d) => EDGE_CONFIG[d.type].width)
      .attr("stroke-linecap", "round");

    // Node groups
    const nodeGroup = g.append("g").attr("class", "nodes");
    const node = nodeGroup
      .selectAll("g")
      .data(simNodes)
      .enter()
      .append("g")
      .attr("class", (d) => `node node-${d.id}`)
      .style("cursor", "pointer")
      .call(
        d3.drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      )
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode((prev) => (prev?.id === d.id ? null : { ...d }));
      })
      .on("mouseenter", (event, d) => setHoveredNode(d.id))
      .on("mouseleave", () => setHoveredNode(null));

    // Node shapes
    node.each(function (d) {
      const el = d3.select(this);
      const cfg = NODE_CONFIG[d.type];
      if (d.type === "paper") {
        el.append("circle")
          .attr("r", cfg.radius)
          .attr("fill", cfg.color + "22")
          .attr("stroke", cfg.color)
          .attr("stroke-width", 1.5);
        el.append("circle").attr("r", 5).attr("fill", cfg.color);
      } else if (d.type === "model") {
        const s = cfg.radius;
        el.append("path")
          .attr("d", `M0,-${s} L${s},0 L0,${s} L-${s},0 Z`)
          .attr("fill", cfg.color + "22")
          .attr("stroke", cfg.color)
          .attr("stroke-width", 1.5);
        el.append("path")
          .attr("d", `M0,-${s * 0.3} L${s * 0.3},0 L0,${s * 0.3} L-${s * 0.3},0 Z`)
          .attr("fill", cfg.color);
      } else {
        const s = cfg.radius;
        el.append("rect")
          .attr("x", -s).attr("y", -s)
          .attr("width", s * 2).attr("height", s * 2)
          .attr("rx", 3)
          .attr("fill", cfg.color + "22")
          .attr("stroke", cfg.color)
          .attr("stroke-width", 1.5);
        el.append("rect")
          .attr("x", -s * 0.3).attr("y", -s * 0.3)
          .attr("width", s * 0.6).attr("height", s * 0.6)
          .attr("rx", 1)
          .attr("fill", cfg.color);
      }
    });

    // Labels
    node.append("text")
      .text((d) => d.label)
      .attr("y", (d) => NODE_CONFIG[d.type].radius + 14)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px")
      .attr("font-family", "'JetBrains Mono', 'Courier New', monospace")
      .attr("pointer-events", "none")
      .each(function (d) {
        const text = d3.select(this);
        const words = d.label.split(" ");
        if (words.length > 3) {
          text.text(words.slice(0, 3).join(" ") + "…");
        }
      });

    // Click on background = deselect
    svg.on("click", () => setSelectedNode(null));

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Store simNodes reference for selection updates
    svgRef.current._simNodes = simNodes;
    svgRef.current._simEdges = simEdges;

    return () => simulation.stop();
  }, [filteredData]);

  // Handle selection highlight
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const simEdges = svgRef.current._simEdges || [];

    if (!selectedNode) {
      // Reset all
      svg.selectAll(".node").each(function () {
        d3.select(this)
          .attr("filter", null)
          .style("opacity", 1)
          .attr("transform", (d) => {
            const cur = d3.select(this).attr("transform");
            return cur;
          });
      });
      svg.selectAll(".edge").style("opacity", 1).attr("stroke-width", (d) => EDGE_CONFIG[d.type].width);
      return;
    }

    const { neighborIds, edgeIds } = getSubgraph(selectedNode.id, simEdges);
    const connectedSet = new Set([selectedNode.id, ...neighborIds]);

    // Fade unconnected nodes
    svg.selectAll(".node").each(function (d) {
      const el = d3.select(this);
      const isConnected = connectedSet.has(d.id);
      const isSelected = d.id === selectedNode.id;
      el.style("opacity", isConnected ? 1 : 0.08);
      if (isSelected) {
        el.attr("filter", "url(#glow-selected)");
      } else if (isConnected) {
        el.attr("filter", `url(#glow-${d.type})`);
      } else {
        el.attr("filter", null);
      }
    });

    // Highlight connected edges
    svg.selectAll(".edge").each(function (d) {
      const isConnected = edgeIds.has(d.id);
      d3.select(this)
        .style("opacity", isConnected ? 1 : 0.04)
        .attr("stroke", isConnected ? (d.type === "uses_model" ? "#f59e0b" : "#a78bfa") : EDGE_CONFIG[d.type].color)
        .attr("stroke-width", isConnected ? 2.5 : EDGE_CONFIG[d.type].width);
    });
  }, [selectedNode]);

  // ─── UI ───────────────────────────────────────
  const { neighborIds } = selectedNode
    ? getSubgraph(selectedNode.id, svgRef.current?._simEdges || graphData.edges)
    : { neighborIds: new Set() };

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "#050a14",
      display: "flex", flexDirection: "column",
      fontFamily: "'JetBrains Mono', monospace",
      color: "#cbd5e1",
      overflow: "hidden",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Space+Grotesk:wght@400;600;700&display=swap');

        * { box-sizing: border-box; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 2px; }

        .filter-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 12px; border-radius: 6px;
          border: 1px solid transparent;
          cursor: pointer; font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.05em; font-weight: 500;
          transition: all 0.15s;
        }
        .filter-btn:hover { opacity: 0.85; }

        .node-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 3px 10px; border-radius: 20px;
          font-size: 10px; font-weight: 500; letter-spacing: 0.08em;
        }
        .neighbor-chip {
          padding: 5px 10px; border-radius: 4px;
          font-size: 10px; border: 1px solid #1e293b;
          color: #64748b; margin: 2px;
          display: inline-block;
          cursor: pointer; transition: border-color 0.15s, color 0.15s;
        }
        .neighbor-chip:hover { border-color: #38bdf8; color: #38bdf8; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .panel { animation: fadeUp 0.2s ease; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        padding: "14px 24px",
        borderBottom: "1px solid #0f1f36",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#060d1a",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>⬡</div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
              Research Graph Explorer
            </div>
            <div style={{ fontSize: 10, color: "#334155", letterSpacing: "0.08em", marginTop: 1 }}>
              PAPERS · MODELS · DATASETS
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#334155", fontSize: 12 }}>⌕</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="search nodes…"
            style={{
              background: "#0a1628", border: "1px solid #1e3a5f",
              borderRadius: 8, padding: "7px 14px 7px 28px",
              color: "#94a3b8", fontSize: 11, width: 220,
              fontFamily: "'JetBrains Mono', monospace", outline: "none",
            }}
          />
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 20, fontSize: 11, color: "#475569" }}>
          {["paper", "model", "dataset"].map((t) => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: t === "dataset" ? 1 : t === "model" ? 0 : "50%", background: NODE_CONFIG[t].color, display: "inline-block", transform: t === "model" ? "rotate(45deg)" : "none" }} />
              {graphData.nodes.filter((n) => n.type === t).length} {t}s
            </span>
          ))}
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── LEFT SIDEBAR: FILTERS ── */}
        <aside style={{
          width: 210, background: "#060d1a",
          borderRight: "1px solid #0f1f36",
          padding: "20px 14px",
          display: "flex", flexDirection: "column", gap: 24,
          flexShrink: 0,
          overflowY: "auto",
        }}>

          {/* NODE TYPES */}
          <div>
            <div style={{ fontSize: 9, color: "#1e3a5f", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 12 }}>NODE TYPES</div>
            {[
              { key: "paper",   label: "Papers",   icon: "●" },
              { key: "model",   label: "Models",   icon: "◆" },
              { key: "dataset", label: "Datasets", icon: "■" },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                className="filter-btn"
                onClick={() => setFilters((f) => ({ ...f, [key]: !f[key] }))}
                style={{
                  width: "100%", marginBottom: 6,
                  background: filters[key] ? NODE_CONFIG[key].color + "18" : "#0a1628",
                  border: `1px solid ${filters[key] ? NODE_CONFIG[key].color + "66" : "#1e293b"}`,
                  color: filters[key] ? NODE_CONFIG[key].color : "#334155",
                }}
              >
                <span style={{ fontSize: 10 }}>{icon}</span>
                {label}
                <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.6 }}>
                  {graphData.nodes.filter((n) => n.type === key).length}
                </span>
              </button>
            ))}
          </div>

          {/* YEAR RANGE */}
          <div>
            <div style={{ fontSize: 9, color: "#1e3a5f", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 12 }}>YEAR RANGE</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "#38bdf8", fontWeight: 500 }}>{filters.yearMin}</span>
              <span style={{ fontSize: 11, color: "#38bdf8", fontWeight: 500 }}>{filters.yearMax}</span>
            </div>
            {/* Min year slider */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: "#334155", marginBottom: 4, letterSpacing: "0.08em" }}>FROM</div>
              <input
                type="range"
                min={DATA_MIN_YEAR} max={DATA_MAX_YEAR} step={1}
                value={filters.yearMin}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setFilters((f) => ({ ...f, yearMin: Math.min(v, f.yearMax) }));
                }}
                style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer" }}
              />
            </div>
            {/* Max year slider */}
            <div>
              <div style={{ fontSize: 9, color: "#334155", marginBottom: 4, letterSpacing: "0.08em" }}>TO</div>
              <input
                type="range"
                min={DATA_MIN_YEAR} max={DATA_MAX_YEAR} step={1}
                value={filters.yearMax}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setFilters((f) => ({ ...f, yearMax: Math.max(v, f.yearMin) }));
                }}
                style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer" }}
              />
            </div>
          </div>

          {/* MIN CITATIONS */}
          <div>
            <div style={{ fontSize: 9, color: "#1e3a5f", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 12 }}>MIN CITATIONS</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#a78bfa", fontWeight: 500 }}>
                {filters.minCitations >= 1000
                  ? `${(filters.minCitations / 1000).toFixed(0)}k+`
                  : `${filters.minCitations}+`}
              </span>
              <span style={{ fontSize: 9, color: "#334155" }}>
                {graphData.nodes.filter(
                  (n) => n.type === "paper" && (n.metadata.citationCount || 0) >= filters.minCitations
                ).length} papers
              </span>
            </div>
            <input
              type="range"
              min={0} max={90000} step={500}
              value={filters.minCitations}
              onChange={(e) => setFilters((f) => ({ ...f, minCitations: Number(e.target.value) }))}
              style={{ width: "100%", accentColor: "#a78bfa", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 9, color: "#1e3a5f" }}>0</span>
              <span style={{ fontSize: 9, color: "#1e3a5f" }}>90k</span>
            </div>
          </div>

          {/* EDGE TYPES */}
          <div>
            <div style={{ fontSize: 9, color: "#1e3a5f", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 12 }}>EDGE TYPES</div>
            {[
              { key: "uses_model",   color: "#f59e0b", label: "Uses Model" },
              { key: "uses_dataset", color: "#a78bfa", label: "Uses Dataset" },
            ].map(({ key, color, label }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 11, color: "#475569" }}>
                <svg width="20" height="2"><line x1="0" y1="1" x2="20" y2="1" stroke={color} strokeWidth="1.5" strokeDasharray={key === "uses_dataset" ? "3,2" : "0"} /></svg>
                {label}
              </div>
            ))}
          </div>

          {/* CONTROLS */}
          <div>
            <div style={{ fontSize: 9, color: "#1e3a5f", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 12 }}>CONTROLS</div>
            <div style={{ fontSize: 10, color: "#334155", lineHeight: 1.8 }}>
              <div>Scroll → Zoom</div>
              <div>Drag → Pan</div>
              <div>Click node → Highlight</div>
              <div>Drag node → Reposition</div>
            </div>
          </div>

          {/* RESET — pinned at bottom */}
          <div style={{ marginTop: "auto" }}>
            <button
              onClick={() => {
                setFilters({ ...DEFAULT_FILTERS });
                setSearchQuery("");
                setSelectedNode(null);
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "transparent",
                border: "1px solid #1e3a5f",
                borderRadius: 6,
                color: "#475569",
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                cursor: "pointer",
                letterSpacing: "0.05em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#38bdf8"; e.currentTarget.style.color = "#38bdf8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.color = "#475569"; }}
            >
              ↺ Reset Graph
            </button>
          </div>
        </aside>

        {/* ── GRAPH CANVAS ── */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {/* Background grid */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0 L0 0 0 40" fill="none" stroke="#0a1f3d" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />

          {/* Empty state */}
          {filteredData().nodes.length === 0 && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              color: "#1e3a5f", gap: 8,
            }}>
              <div style={{ fontSize: 32 }}>⬡</div>
              <div style={{ fontSize: 12 }}>No nodes match the current filters</div>
            </div>
          )}

          {/* Legend */}
          <div style={{
            position: "absolute", bottom: 16, left: 16,
            background: "#060d1a", border: "1px solid #0f1f36",
            borderRadius: 8, padding: "8px 12px",
            fontSize: 10, color: "#475569",
          }}>
            Click a node to explore its connections
          </div>
        </div>

        {/* ── RIGHT PANEL: NODE DETAIL ── */}
        {selectedNode && (
          <aside className="panel" style={{
            width: 280, background: "#060d1a",
            borderLeft: "1px solid #0f1f36",
            padding: "20px 16px",
            overflowY: "auto",
            flexShrink: 0,
            display: "flex", flexDirection: "column", gap: 20,
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span
                className="node-badge"
                style={{
                  background: NODE_CONFIG[selectedNode.type].color + "22",
                  color: NODE_CONFIG[selectedNode.type].color,
                  border: `1px solid ${NODE_CONFIG[selectedNode.type].color}44`,
                }}
              >
                {selectedNode.type === "paper" ? "●" : selectedNode.type === "model" ? "◆" : "■"}
                {selectedNode.type.toUpperCase()}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
              >×</button>
            </div>

            {/* Title */}
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: "#f1f5f9", lineHeight: 1.4 }}>
                {selectedNode.metadata.title || selectedNode.label}
              </div>

              {selectedNode.metadata.authors && (
                <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>
                  {selectedNode.metadata.authors.map((a) => (typeof a === "object" ? a.name : a)).join(", ")}
                </div>
              )}
            </div>

            {/* TLDR */}
            {selectedNode.metadata.tldr?.text && (
              <div style={{
                background: "#0a1628", border: "1px solid #1e3a5f",
                borderRadius: 6, padding: "10px 12px",
              }}>
                <div style={{ fontSize: 9, color: "#334155", letterSpacing: "0.12em", marginBottom: 6, fontWeight: 600 }}>TL;DR</div>
                <p style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.65, margin: 0 }}>
                  {selectedNode.metadata.tldr.text}
                </p>
              </div>
            )}

            {/* Metadata key-value rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {[
                ["Year",         selectedNode.metadata.year],
                ["Published",    selectedNode.metadata.publicationDate],
                ["Venue",        selectedNode.metadata.publicationVenue?.name || selectedNode.metadata.venue],
                ["Journal",      selectedNode.metadata.journal?.name && selectedNode.metadata.journal.name !== "ArXiv" ? selectedNode.metadata.journal.name : null],
                ["Pub. Types",   selectedNode.metadata.publicationTypes?.join(", ")],
                ["arXiv",        selectedNode.metadata.arxivId],
                ["S2 ID",        selectedNode.metadata.semanticScholarId ? selectedNode.metadata.semanticScholarId.slice(0, 12) + "…" : null],
                ["Citations",    selectedNode.metadata.citationCount?.toLocaleString()],
                ["Inf. Citations",selectedNode.metadata.influentialCitationCount?.toLocaleString()],
                ["References",   selectedNode.metadata.referenceCount?.toLocaleString()],
                ["Fields",       selectedNode.metadata.fieldsOfStudy?.join(", ")],
                // Model fields
                ["Task",         selectedNode.metadata.task],
                ["Framework",    selectedNode.metadata.framework],
                ["Params",       selectedNode.metadata.paramCount],
                // Dataset fields
                ["Size",         selectedNode.metadata.size],
              ].filter(([, v]) => v != null && v !== "").map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 9, color: "#334155", letterSpacing: "0.08em", whiteSpace: "nowrap", paddingTop: 1 }}>{String(k).toUpperCase()}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", textAlign: "right", flex: 1 }}>{String(v)}</span>
                </div>
              ))}
            </div>

            {/* Open Access badge */}
            {selectedNode.metadata.isOpenAccess != null && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  padding: "3px 8px", borderRadius: 4, fontSize: 9, fontWeight: 600,
                  letterSpacing: "0.1em",
                  background: selectedNode.metadata.isOpenAccess ? "#22c55e18" : "#ef444418",
                  color:      selectedNode.metadata.isOpenAccess ? "#22c55e"   : "#ef4444",
                  border: `1px solid ${selectedNode.metadata.isOpenAccess ? "#22c55e44" : "#ef444444"}`,
                }}>
                  {selectedNode.metadata.isOpenAccess ? "✓ OPEN ACCESS" : "⊘ CLOSED ACCESS"}
                </span>
                {selectedNode.metadata.openAccessPdf?.url && (
                  <a
                    href={selectedNode.metadata.openAccessPdf.url}
                    target="_blank" rel="noreferrer"
                    style={{ fontSize: 10, color: "#38bdf8", textDecoration: "none" }}
                  >PDF ↗</a>
                )}
              </div>
            )}

            {/* Abstract */}
            {selectedNode.metadata.abstract && (
              <div>
                <div style={{ fontSize: 9, color: "#1e3a5f", letterSpacing: "0.15em", marginBottom: 8, fontWeight: 600 }}>ABSTRACT</div>
                <p style={{ fontSize: 11, color: "#475569", lineHeight: 1.7, margin: 0 }}>
                  {selectedNode.metadata.abstract.slice(0, 240)}…
                </p>
              </div>
            )}

            {/* Connected nodes */}
            <div>
              <div style={{ fontSize: 9, color: "#1e3a5f", letterSpacing: "0.15em", marginBottom: 10, fontWeight: 600 }}>
                CONNECTIONS ({neighborIds.size})
              </div>
              <div>
                {[...neighborIds].map((nid) => {
                  const n = graphData.nodes.find((x) => x.id === nid);
                  if (!n) return null;
                  return (
                    <span
                      key={nid}
                      className="neighbor-chip"
                      onClick={() => setSelectedNode({ ...n })}
                    >
                      <span style={{ color: NODE_CONFIG[n.type].color, marginRight: 4 }}>
                        {n.type === "paper" ? "●" : n.type === "model" ? "◆" : "■"}
                      </span>
                      {n.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
