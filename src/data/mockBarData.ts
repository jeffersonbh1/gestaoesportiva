import { BarProduct, BarCategoryItem, BarSale, BarComanda, StockMovement } from '../types';
import { getBrasiliaTodayDate, shiftDateString } from '../utils';

export const INITIAL_BAR_CATEGORIES: BarCategoryItem[] = [
  { id: 'cat-1', name: 'Bebidas', status_ativo: 1 },
  { id: 'cat-2', name: 'Salgados', status_ativo: 1 },
  { id: 'cat-3', name: 'Petiscos', status_ativo: 1 },
  { id: 'cat-4', name: 'Espetinhos', status_ativo: 1 },
  { id: 'cat-5', name: 'Sanduíches', status_ativo: 1 },
  { id: 'cat-6', name: 'Picolés', status_ativo: 1 },
  { id: 'cat-7', name: 'Açaí', status_ativo: 1 },
  { id: 'cat-8', name: 'Doces', status_ativo: 1 },
  { id: 'cat-9', name: 'Outros', status_ativo: 1 },
];

export const INITIAL_BAR_PRODUCTS: BarProduct[] = [
  // Bebidas
  {
    id: 'prod-1',
    name: 'Cerveja Heineken Long Neck 330ml',
    category: 'Bebidas',
    price: 12.00,
    costPrice: 6.50,
    stock: 48,
    minStock: 12,
    unit: 'un',
    description: 'Cerveja gelada em garrafa de 330ml',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-2',
    name: 'Cerveja Amstel Latão 473ml',
    category: 'Bebidas',
    price: 9.00,
    costPrice: 4.20,
    stock: 36,
    minStock: 10,
    unit: 'un',
    description: 'Cerveja lata 473ml estupidamente gelada',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-3',
    name: 'Refrigerante Coca-Cola Lata 350ml',
    category: 'Bebidas',
    price: 6.00,
    costPrice: 3.00,
    stock: 24,
    minStock: 8,
    unit: 'un',
    description: 'Coca-Cola tradicional lata 350ml',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-4',
    name: 'Água Mineral sem Gás 500ml',
    category: 'Bebidas',
    price: 4.00,
    costPrice: 1.50,
    stock: 60,
    minStock: 15,
    unit: 'un',
    description: 'Garrafa de água mineral 500ml',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-5',
    name: 'Água de Coco Natural 500ml',
    category: 'Bebidas',
    price: 8.00,
    costPrice: 3.50,
    stock: 15,
    minStock: 5,
    unit: 'un',
    description: 'Água de coco bem gelada',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-6',
    name: 'Energético Red Bull 250ml',
    category: 'Bebidas',
    price: 15.00,
    costPrice: 8.00,
    stock: 18,
    minStock: 6,
    unit: 'un',
    description: 'Energético lata 250ml',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=300&auto=format&fit=crop&q=80'
  },

  // Espetinhos
  {
    id: 'prod-7',
    name: 'Espetinho de Carne Bovino',
    category: 'Espetinhos',
    price: 10.00,
    costPrice: 4.50,
    stock: 30,
    minStock: 10,
    unit: 'un',
    description: 'Acompanha farofa e molho à campanha',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-8',
    name: 'Espetinho de Frango com Bacon',
    category: 'Espetinhos',
    price: 10.00,
    costPrice: 4.00,
    stock: 25,
    minStock: 8,
    unit: 'un',
    description: 'Suculento peito de frango envolvido no bacon',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-9',
    name: 'Espetinho de Queijo Coalho',
    category: 'Espetinhos',
    price: 9.00,
    costPrice: 3.50,
    stock: 20,
    minStock: 5,
    unit: 'un',
    description: 'Queijo coalho tostado na brasa com melaço opcional',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-10',
    name: 'Espetinho de Linguiça Toscana',
    category: 'Espetinhos',
    price: 8.50,
    costPrice: 3.00,
    stock: 22,
    minStock: 6,
    unit: 'un',
    description: 'Linguiça toscana assada na brasa com farofa',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=80'
  },

  // Petiscos
  {
    id: 'prod-11',
    name: 'Batata Frita Crocante (500g)',
    category: 'Petiscos',
    price: 28.00,
    costPrice: 10.00,
    stock: 15,
    minStock: 5,
    unit: 'porção',
    description: 'Servida com molho especial de alho e cheddar',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-12',
    name: 'Iscas de Peixe com Molho Tártaro',
    category: 'Petiscos',
    price: 42.00,
    costPrice: 18.00,
    stock: 8,
    minStock: 3,
    unit: 'porção',
    description: 'Iscas crocantes de tilápia com limão e molho tártaro',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-13',
    name: 'Frango a Passarinho (600g)',
    category: 'Petiscos',
    price: 38.00,
    costPrice: 15.00,
    stock: 10,
    minStock: 4,
    unit: 'porção',
    description: 'Frango crocante com alho dourado e cheiro verde',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&auto=format&fit=crop&q=80'
  },

  // Sanduíches
  {
    id: 'prod-14',
    name: 'X-Tudo Fahel Beach',
    category: 'Sanduíches',
    price: 28.00,
    costPrice: 12.00,
    stock: 12,
    minStock: 4,
    unit: 'un',
    description: 'Hambúrguer artesanal 180g, queijo, bacon, ovo, salada e molho da casa',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-15',
    name: 'X-Salada Especial',
    category: 'Sanduíches',
    price: 22.00,
    costPrice: 9.00,
    stock: 15,
    minStock: 5,
    unit: 'un',
    description: 'Hambúrguer artesanal 160g, queijo prato, alface, tomate e maionese temperada',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-16',
    name: 'Misto Quente na Chapa',
    category: 'Sanduíches',
    price: 12.00,
    costPrice: 4.50,
    stock: 20,
    minStock: 6,
    unit: 'un',
    description: 'Pão de forma especial na manteiga, presunto e queijo derretido',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&auto=format&fit=crop&q=80'
  },

  // Salgados
  {
    id: 'prod-17',
    name: 'Coxinha de Frango com Catupiry',
    category: 'Salgados',
    price: 8.50,
    costPrice: 3.80,
    stock: 24,
    minStock: 6,
    unit: 'un',
    description: 'Coxinha crocante recheada com frango desfiado e catupiry',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-18',
    name: 'Enroladinho de Presunto e Queijo',
    category: 'Salgados',
    price: 8.00,
    costPrice: 3.50,
    stock: 20,
    minStock: 5,
    unit: 'un',
    description: 'Massa assada macia recheada com presunto e mussarela',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&auto=format&fit=crop&q=80'
  },

  // Picolés
  {
    id: 'prod-19',
    name: 'Picolé Frutas Tropicais (Maracujá/Limão)',
    category: 'Picolés',
    price: 6.00,
    costPrice: 2.20,
    stock: 35,
    minStock: 10,
    unit: 'un',
    description: 'Picolé refrescante feito com polpa de fruta natural',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-20',
    name: 'Picolé Especial Chocolate Belga',
    category: 'Picolés',
    price: 9.00,
    costPrice: 4.00,
    stock: 20,
    minStock: 6,
    unit: 'un',
    description: 'Picolé cremoso de chocolate com cobertura crocante',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=300&auto=format&fit=crop&q=80'
  },

  // Açaí
  {
    id: 'prod-21',
    name: 'Copo de Açaí Tradicional 300ml',
    category: 'Açaí',
    price: 16.00,
    costPrice: 7.00,
    stock: 30,
    minStock: 8,
    unit: 'un',
    description: 'Açaí batido puro, acompanha granola e banana fatiada',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-22',
    name: 'Tigela de Açaí Especial 500ml',
    category: 'Açaí',
    price: 24.00,
    costPrice: 10.50,
    stock: 20,
    minStock: 5,
    unit: 'un',
    description: 'Açaí 500ml com leite condensado, leite em pó, morango e paçoca',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1553882951-9c3dab4a50cb?w=300&auto=format&fit=crop&q=80'
  },

  // Doces
  {
    id: 'prod-23',
    name: 'Barra de Chocolate / Bombom Especial',
    category: 'Doces',
    price: 5.00,
    costPrice: 2.00,
    stock: 40,
    minStock: 10,
    unit: 'un',
    description: 'Diversos sabores (Sonho de Valsa, Ouro Branco, KitKat)',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1548848221-0c2e497ed557?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-24',
    name: 'Pudim de Leite Condensado (Pote 150g)',
    category: 'Doces',
    price: 10.00,
    costPrice: 4.20,
    stock: 15,
    minStock: 4,
    unit: 'un',
    description: 'Pudim caseiro cremoso com calda de caramelo',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=300&auto=format&fit=crop&q=80'
  }
];

export const getInitialBarSales = (): BarSale[] => {
  const today = getBrasiliaTodayDate();
  const yesterday = shiftDateString(today, -1);

  return [
    {
      id: 'sale-1',
      code: 'V001',
      customerName: 'Carlos Eduardo',
      location: 'Quadra 1',
      items: [
        { productId: 'prod-1', productName: 'Cerveja Heineken Long Neck 330ml', quantity: 3, unitPrice: 12.00, totalPrice: 36.00 },
        { productId: 'prod-7', productName: 'Espetinho de Carne Bovino', quantity: 2, unitPrice: 10.00, totalPrice: 20.00 }
      ],
      totalAmount: 56.00,
      discount: 0,
      finalAmount: 56.00,
      paymentMethod: 'Pix',
      paymentStatus: 'Pago',
      status: 'Concluída',
      createdAt: `${today} 10:15`,
      date: today,
      notes: 'Entregar na Quadra 1'
    },
    {
      id: 'sale-2',
      code: 'V002',
      customerName: 'Fernanda Lima',
      location: 'Mesa 3',
      items: [
        { productId: 'prod-11', productName: 'Batata Frita Crocante (500g)', quantity: 1, unitPrice: 28.00, totalPrice: 28.00 },
        { productId: 'prod-3', productName: 'Refrigerante Coca-Cola Lata 350ml', quantity: 2, unitPrice: 6.00, totalPrice: 12.00 }
      ],
      totalAmount: 40.00,
      discount: 0,
      finalAmount: 40.00,
      paymentMethod: 'Cartão de Crédito',
      paymentStatus: 'Pago',
      status: 'Concluída',
      createdAt: `${today} 11:00`,
      date: today
    },
    {
      id: 'sale-3',
      code: 'V003',
      customerName: 'Lucas Pedrosa',
      location: 'Balcão',
      items: [
        { productId: 'prod-14', productName: 'X-Tudo Fahel Beach', quantity: 1, unitPrice: 28.00, totalPrice: 28.00 },
        { productId: 'prod-1', productName: 'Cerveja Heineken Long Neck 330ml', quantity: 2, unitPrice: 12.00, totalPrice: 24.00 }
      ],
      totalAmount: 52.00,
      discount: 2.00,
      finalAmount: 50.00,
      paymentMethod: 'Dinheiro',
      paymentStatus: 'Pago',
      status: 'Concluída',
      createdAt: `${yesterday} 19:30`,
      date: yesterday
    }
  ];
};

export const getInitialComandas = (): BarComanda[] => {
  const today = getBrasiliaTodayDate();

  return [
    {
      id: 'cmd-1',
      code: '#001',
      customerName: 'Ricardo Oliveira',
      customerPhone: '(71) 99823-1102',
      location: 'Mesa 04 (Lounge)',
      status: 'Aberta',
      openedAt: `${today} 11:30`,
      date: today,
      discount: 0,
      totalAmount: 48.00,
      finalAmount: 48.00,
      items: [
        {
          id: 'ci-1',
          productId: 'prod-1',
          productName: 'Cerveja Heineken Long Neck 330ml',
          quantity: 2,
          unitPrice: 12.00,
          totalPrice: 24.00,
          addedAt: '11:32'
        },
        {
          id: 'ci-2',
          productId: 'prod-7',
          productName: 'Espetinho de Carne Bovino',
          quantity: 1,
          unitPrice: 10.00,
          totalPrice: 10.00,
          addedAt: '11:45'
        },
        {
          id: 'ci-3',
          productId: 'prod-3',
          productName: 'Refrigerante Coca-Cola Lata 350ml',
          quantity: 2,
          unitPrice: 7.00,
          totalPrice: 14.00,
          addedAt: '12:10'
        }
      ]
    },
    {
      id: 'cmd-2',
      code: '#002',
      customerName: 'Mariana Santos',
      customerPhone: '(71) 98744-5511',
      location: 'Quadra 2 (Beach Tennis)',
      status: 'Aberta',
      openedAt: `${today} 12:15`,
      date: today,
      discount: 0,
      totalAmount: 32.00,
      finalAmount: 32.00,
      items: [
        {
          id: 'ci-4',
          productId: 'prod-5',
          productName: 'Água de Coco Natural 500ml',
          quantity: 2,
          unitPrice: 8.00,
          totalPrice: 16.00,
          addedAt: '12:15'
        },
        {
          id: 'ci-5',
          productId: 'prod-6',
          productName: 'Energético Red Bull 250ml',
          quantity: 1,
          unitPrice: 16.00,
          totalPrice: 16.00,
          addedAt: '12:30'
        }
      ]
    }
  ];
};

export const getInitialStockMovements = (): StockMovement[] => {
  const today = getBrasiliaTodayDate();
  return [
    {
      id: 'mov-1',
      productId: 'prod-1',
      productName: 'Cerveja Heineken Long Neck 330ml',
      type: 'Entrada',
      quantity: 60,
      reason: 'Estoque Inicial / Carga de Mercadoria',
      createdAt: `${today} 08:00`,
      user: 'Admin Arena'
    },
    {
      id: 'mov-2',
      productId: 'prod-11',
      productName: 'Batata Frita Crocante (500g)',
      type: 'Entrada',
      quantity: 20,
      reason: 'Reposicão de Cozinha',
      createdAt: `${today} 08:30`,
      user: 'Admin Arena'
    }
  ];
};
