/**
 * OnePixel Studio - Official Legal Documentation Content
 * Complete legal sections: Terms of Service, Privacy Policy, Intellectual Property,
 * Third-Party Open Source Licenses, Disclaimers, Donations, and Contact.
 * 
 * Supports: Spanish (es), English (en), Portuguese (pt), Japanese (ja), Russian (ru), Chinese (zh-CN).
 */

import { LanguageCode } from '../i18n/types';
import { LEGAL_VERSION, LEGAL_EFFECTIVE_DATE, OFFICIAL_LEGAL_EMAIL } from '../config/LegalConfig';

export interface LegalSection {
  id: 'terms' | 'privacy' | 'intellectual_property' | 'licenses' | 'disclaimer' | 'donations' | 'contact';
  title: string;
  category: string;
  badge?: string;
  summary: string;
  paragraphs: string[];
  bulletPoints?: Array<{ label: string; text: string }>;
  subsections?: Array<{ title: string; content: string[] }>;
}

export interface ThirdPartyLicense {
  name: string;
  version: string;
  license: string;
  author: string;
  purpose: string;
  url?: string;
}

export const THIRD_PARTY_LICENSES: ThirdPartyLicense[] = [
  {
    name: 'react & react-dom',
    version: '^19.0.1',
    license: 'MIT',
    author: 'Meta Platforms, Inc. and affiliates',
    purpose: 'Biblioteca fundamental para la interfaz de usuario reactiva y renderizado de componentes.',
    url: 'https://react.dev'
  },
  {
    name: 'lucide-react',
    version: '^0.546.0',
    license: 'ISC / MIT',
    author: 'Lucide Contributors',
    purpose: 'Iconografía vectorial ligera y accesible.',
    url: 'https://lucide.dev'
  },
  {
    name: 'motion',
    version: '^12.23.24',
    license: 'MIT',
    author: 'Motion Software / Framer',
    purpose: 'Animaciones de interfaz, transiciones suaves y micro-interacciones.',
    url: 'https://motion.dev'
  },
  {
    name: 'fflate',
    version: '^0.8.3',
    license: 'MIT',
    author: '101arrowz',
    purpose: 'Compresión y descompresión ultrarrápida para empaquetado de secuencias de sprites en archivos ZIP.',
    url: 'https://github.com/101arrowz/fflate'
  },
  {
    name: 'gifenc',
    version: '^1.0.3',
    license: 'MIT',
    author: 'Matt DesLauriers',
    purpose: 'Codificador rápido y eficiente para exportación de GIF animados pixel art.',
    url: 'https://github.com/mattdesl/gifenc'
  },
  {
    name: 'ag-psd',
    version: '^31.0.2',
    license: 'MIT',
    author: 'Ag-Grid / Anton Lapshin',
    purpose: 'Lectura y escritura de capas y documentos en formato Adobe Photoshop (PSD).',
    url: 'https://github.com/Ag-AP/ag-psd'
  },
  {
    name: 'ase-parser',
    version: '^0.0.18',
    license: 'MIT',
    author: 'Aseprite Parser Contributors',
    purpose: 'Decodificación e importación de archivos nativos de Aseprite (.ase / .aseprite).',
    url: 'https://github.com/aseprite'
  },
  {
    name: 'jspdf',
    version: '^4.2.1',
    license: 'MIT',
    author: 'James Hall / parallax',
    purpose: 'Generación y exportación de hojas de sprites y documentación gráfica en formato PDF.',
    url: 'https://github.com/parallax/jsPDF'
  },
  {
    name: 'nodemailer',
    version: '^9.1.0',
    license: 'MIT',
    author: 'Andris Reinman',
    purpose: 'Canal de entrega para el sistema de soporte voluntario del backend.',
    url: 'https://nodemailer.com'
  },
  {
    name: 'express',
    version: '^4.21.2',
    license: 'MIT',
    author: 'OpenJS Foundation / StrongLoop',
    purpose: 'Servidor ligero para la entrega de la aplicación y endpoints de soporte.',
    url: 'https://expressjs.com'
  },
  {
    name: 'dotenv',
    version: '^17.2.3',
    license: 'BSD-2-Clause',
    author: 'Motdotla',
    purpose: 'Gestión segura de variables de entorno locales de servidor.',
    url: 'https://github.com/motdotla/dotenv'
  },
  {
    name: '@google/genai',
    version: '^2.4.0',
    license: 'Apache-2.0',
    author: 'Google LLC',
    purpose: 'Integración del SDK de modelos generativos server-side.',
    url: 'https://ai.google.dev'
  },
  {
    name: 'tailwindcss & @tailwindcss/vite',
    version: '^4.1.14',
    license: 'MIT',
    author: 'Tailwind Labs, Inc.',
    purpose: 'Framework de diseño con utilidades CSS modernas.',
    url: 'https://tailwindcss.com'
  },
  {
    name: 'vite & @vitejs/plugin-react',
    version: '^6.2.3',
    license: 'MIT',
    author: 'Evan You & Vite Contributors',
    purpose: 'Entorno de desarrollo y empaquetado de producción optimizado.',
    url: 'https://vite.dev'
  },
  {
    name: 'typescript',
    version: '~5.8.2',
    license: 'Apache-2.0',
    author: 'Microsoft Corporation',
    purpose: 'Tipado estático y compilación de código seguro.',
    url: 'https://www.typescriptlang.org'
  },
  {
    name: 'vitest',
    version: '^4.1.9',
    license: 'MIT',
    author: 'Vitest Contributors',
    purpose: 'Marco de pruebas unitarias y de integración de alta velocidad.',
    url: 'https://vitest.dev'
  },
  {
    name: 'esbuild',
    version: '^0.25.0',
    license: 'MIT',
    author: 'Evan Wallace',
    purpose: 'Empaquetador y transformador de código de alto rendimiento.',
    url: 'https://esbuild.github.io'
  },
  {
    name: 'tsx',
    version: '^4.21.0',
    license: 'MIT',
    author: 'Hiroki Osame',
    purpose: 'Ejecución directa de TypeScript para el entorno de desarrollo y servidor.',
    url: 'https://github.com/privatenumber/tsx'
  }
];

// ------------------------------------------------------------------------------------------------
// CONTENIDOS EN ESPAÑOL (ES)
// ------------------------------------------------------------------------------------------------
const LEGAL_SECTIONS_ES: LegalSection[] = [
  {
    id: 'terms',
    title: 'Términos y Condiciones de Uso',
    category: '1. Términos de Servicio',
    badge: 'Uso del Software',
    summary: 'Condiciones de uso aplicables al acceso, ejecución y utilización de OnePixel Studio.',
    paragraphs: [
      `Bienvenido a OnePixel Studio (versión ${LEGAL_VERSION}, con fecha de entrada en vigor el ${LEGAL_EFFECTIVE_DATE}). Al utilizar nuestra aplicación, aceptas expresamente cumplir y quedar vinculado por estos Términos y Condiciones de Uso. Si no estás de acuerdo con alguno de ellos, te solicitamos no utilizar el software.`,
      `OnePixel Studio es un software de edición gráfica y animación pixel art diseñado para ejecutarse prioritariamente en el entorno local del usuario (navegador web o entorno cliente). El software se proporciona para la creación artística personal, formativa, lúdica o comercial de obras originales.`
    ],
    bulletPoints: [
      {
        label: 'Uso Permitido',
        text: 'Puedes utilizar OnePixel Studio para crear, editar, animar y exportar ilustraciones, sprites, texturas y assets visuales tanto para proyectos personales como comerciales sin abonar regalías a OnePixel Studio.'
      },
      {
        label: 'Responsabilidad sobre los Archivos',
        text: 'El usuario asume la responsabilidad exclusiva sobre el contenido que importe, cree o exporte utilizando el programa, así como de mantener copias de seguridad de sus archivos de proyecto (.onepixel).'
      },
      {
        label: 'Conducta Prohibida',
        text: 'No está permitido intentar descompilar maliciosamente la aplicación para inyectar código dañino, atacar la infraestructura del servidor de soporte o utilizar el software para actividades ilícitas.'
      },
      {
        label: 'Actualizaciones y Disponibilidad',
        text: 'OnePixel Studio puede recibir actualizaciones, mejoras o correcciones periódicas. Nos esforzamos por garantizar la máxima estabilidad, pero no garantizamos la disponibilidad ininterrumpida ante eventualidades de red o navegador.'
      }
    ],
    subsections: [
      {
        title: 'Legislación Aplicable y Resolución de Disputas',
        content: [
          'Estos términos se rigen conforme a los principios de buena fe y las leyes civiles aplicables. En caso de discrepancias, las partes buscarán una resolución amistosa antes de acudir a instancias formales.'
        ]
      }
    ]
  },
  {
    id: 'privacy',
    title: 'Política de Privacidad',
    category: '2. Privacidad y Datos',
    badge: 'Privacidad Garantizada',
    summary: 'Compromiso de privacidad local-first: sin telemetría publicitaria ni recopilación rutinaria de datos personales.',
    paragraphs: [
      'Los proyectos, lienzos, fotogramas, capas, configuraciones y preferencias de OnePixel Studio se almacenan localmente en el dispositivo del usuario, salvo cuando el propio usuario decide explícitamente exportar, compartir o enviar información mediante una función de soporte. OnePixel Studio no realiza recopilación automática de datos con fines de seguimiento, publicidad, perfilado o análisis de comportamiento.'
    ],
    bulletPoints: [
      {
        label: 'Uso Normal del Editor',
        text: 'Durante el uso ordinario del programa, OnePixel Studio NO realiza seguimiento publicitario, NO crea perfiles de usuario, NO vende ni alquila datos personales y NO comparte información con terceros con fines comerciales.'
      },
      {
        label: 'Tus Proyectos Permanecen Locales',
        text: 'Tus dibujos, paletas, fotogramas, capas e imágenes importadas se procesan y almacenan en la memoria local de tu dispositivo. No se transmiten automáticamente a servidores de OnePixel Studio ni a entidades externas.'
      },
      {
        label: 'Sin Obligación de Crear Cuenta',
        text: 'Para usar OnePixel Studio no es necesario registrar una cuenta con datos personales, contraseñas o tarjetas de crédito.'
      },
      {
        label: 'Función Voluntaria de Reporte de Soporte',
        text: 'Si experimentas un problema y decides libremente usar "Ayuda → Enviar reporte", se recopilan metadatos técnicos estrictamente necesarios (resolución, versión de navegador, herramientas activas y registro de acciones anónimas). NO se recopilan píxeles de dibujo, imágenes personales, contraseñas ni tokens de autenticación.'
      },
      {
        label: 'Dirección de Correo Electrónico',
        text: 'Si incluyes voluntariamente tu dirección de correo en un reporte de soporte, se utilizará exclusivamente para responder a tu consulta técnica y dar seguimiento a la incidencia.'
      }
    ]
  },
  {
    id: 'intellectual_property',
    title: 'Propiedad Intelectual y Derechos de Autor',
    category: '3. Propiedad Intelectual',
    badge: 'Tus Derechos',
    summary: 'Propiedad de las creaciones del usuario y derechos sobre el software OnePixel Studio.',
    paragraphs: [
      'Reconocemos y respetamos plenamente los derechos de autor de cada artista y creador de contenido.'
    ],
    bulletPoints: [
      {
        label: 'Titularidad del Usuario',
        text: 'El usuario conserva los derechos que le correspondan sobre las obras que cree utilizando OnePixel Studio. OnePixel Studio no reclama la propiedad de dichas obras ni exige el pago de regalías sobre ellas.'
      },
      {
        label: 'Responsabilidad sobre Contenido de Terceros',
        text: 'El usuario es responsable de contar con los derechos y licencias necesarios sobre cualquier contenido de terceros que importe, utilice o incorpore a sus proyectos.'
      },
      {
        label: 'Derechos sobre el Software',
        text: 'La marca, el isotipo oficial, el código fuente original, los componentes de interfaz y el diseño visual de OnePixel Studio están protegidos por las leyes de propiedad intelectual aplicables.'
      }
    ]
  },
  {
    id: 'licenses',
    title: 'Licencias de Terceros y Código Abierto',
    category: '4. Open Source',
    badge: 'Transparencia',
    summary: 'Relación exhaustiva de dependencias y bibliotecas de código abierto utilizadas en la aplicación.',
    paragraphs: [
      'OnePixel Studio se construye sobre sólidas bibliotecas y tecnologías de código abierto reconocidas por la comunidad global de desarrollo de software. Expresamos nuestro sincero agradecimiento a los autores y contribuidores de cada proyecto.'
    ]
  },
  {
    id: 'disclaimer',
    title: 'Descargo de Responsabilidad y Garantías',
    category: '5. Garantías Legales',
    badge: 'Aviso Legal',
    summary: 'Declaraciones sobre el funcionamiento del software, límites de responsabilidad y buenas prácticas de respaldo.',
    paragraphs: [
      'El software OnePixel Studio se suministra "tal cual" (as is) y "según disponibilidad", sin garantías expresas o implícitas de ningún tipo respecto a su comerciabilidad o idoneidad para un propósito particular.',
      'Aunque aplicamos rigurosos estándares de control de calidad, cualquier software puede contener fallos imprevistos o interactuar de forma anómala con el navegador o el sistema operativo del usuario.',
      'En la máxima medida permitida por la legislación aplicable, OnePixel Studio no será responsable por pérdidas de datos, interrupciones de trabajo o daños indirectos derivados del uso o la imposibilidad de uso del software. Se aconseja a los usuarios mantener copias de seguridad periódicas de sus archivos de proyecto (.onepixel) y exportaciones.'
    ]
  },
  {
    id: 'donations',
    title: 'Donaciones y Soporte Voluntario',
    category: '6. Donaciones',
    badge: 'Apoyo Voluntario',
    summary: 'Información transparente sobre las aportaciones voluntarias a través de plataformas oficiales.',
    paragraphs: [
      'OnePixel Studio es un proyecto independiente y gratuito. Las donaciones económicas voluntarias realizadas mediante nuestras plataformas oficiales constituyen contribuciones voluntarias y no otorgan derechos de propiedad, participación ni control sobre el software. Las donaciones contribuyen al mantenimiento, desarrollo, mejora y operación de OnePixel Studio.',
      'Las donaciones se procesan de forma segura a través de la plataforma externa PayPal (PayPal Holdings, Inc.). OnePixel Studio no procesa, no almacena ni tiene acceso a números de tarjetas de crédito, cuentas bancarias ni credenciales financieras del usuario. Las transacciones se rigen por los términos y la política de privacidad de PayPal.'
    ]
  },
  {
    id: 'contact',
    title: 'Contacto y Canal Oficial de Soporte',
    category: '7. Contacto',
    badge: 'Atención al Usuario',
    summary: 'Canales oficiales para soporte técnico, consultas de privacidad y comunicaciones legales.',
    paragraphs: [
      `Para cualquier consulta técnica, sugerencia de funcionalidad, comunicación relativa a la privacidad o notificación legal sobre OnePixel Studio, puedes comunicarte a través de nuestro canal oficial de soporte:`,
      `Correo electrónico oficial: ${OFFICIAL_LEGAL_EMAIL}`,
      'Nos comprometemos a revisar cada mensaje y responder a la brevedad posible con profesionalismo y transparencia.'
    ]
  }
];

// ------------------------------------------------------------------------------------------------
// CONTENIDOS EN INGLÉS (EN)
// ------------------------------------------------------------------------------------------------
const LEGAL_SECTIONS_EN: LegalSection[] = [
  {
    id: 'terms',
    title: 'Terms and Conditions of Use',
    category: '1. Terms of Service',
    badge: 'Software Usage',
    summary: 'Applicable terms governing your access to and use of OnePixel Studio.',
    paragraphs: [
      `Welcome to OnePixel Studio (Version ${LEGAL_VERSION}, effective as of ${LEGAL_EFFECTIVE_DATE}). By using our software, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, please do not use the application.`,
      `OnePixel Studio is a graphic editing and pixel art animation suite designed to run locally in the user's client environment (web browser). It is provided for personal, educational, recreational, or commercial creation of original artwork.`
    ],
    bulletPoints: [
      {
        label: 'Permitted Use',
        text: 'You may use OnePixel Studio to create, edit, animate, and export pixel art sprites, textures, and assets for personal or commercial projects without paying royalties to OnePixel Studio.'
      },
      {
        label: 'User Responsibility',
        text: 'You are solely responsible for all artwork and assets you create or import into the application, as well as maintaining backups of your project files (.onepixel).'
      },
      {
        label: 'Prohibited Conduct',
        text: 'You agree not to reverse engineer with malicious intent, inject harmful code, attack server infrastructure, or use the software for unlawful activities.'
      },
      {
        label: 'Updates & Availability',
        text: 'OnePixel Studio may receive updates and improvements. While we strive for maximum reliability, uninterrupted availability is not guaranteed.'
      }
    ],
    subsections: [
      {
        title: 'Governing Principles & Dispute Resolution',
        content: [
          'These terms are interpreted in good faith under applicable general laws. Parties shall seek amicable resolution prior to initiating formal procedures.'
        ]
      }
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    category: '2. Privacy & Data',
    badge: 'Privacy Guaranteed',
    summary: 'Our local-first privacy commitment: no advertising trackers and no routine personal data collection.',
    paragraphs: [
      'Projects, canvases, frames, layers, settings, and preferences in OnePixel Studio are stored locally on the user\'s device, except when the user explicitly chooses to export, share, or submit information through a support feature. OnePixel Studio does not perform automatic data collection for tracking, advertising, profiling, or behavioral analytics.'
    ],
    bulletPoints: [
      {
        label: 'Normal Editor Usage',
        text: 'During regular use, OnePixel Studio does NOT perform advertising tracking, does NOT create user profiles, does NOT sell or rent personal data, and does NOT share data with third parties for marketing purposes.'
      },
      {
        label: 'Your Projects Remain Local',
        text: 'Your artwork, color palettes, frames, layers, and imported files are processed and stored in your device\'s local storage. They are not automatically transmitted to OnePixel Studio servers or third-party endpoints.'
      },
      {
        label: 'No Mandatory Account',
        text: 'Using OnePixel Studio does not require registering an account, providing personal names, passwords, or payment cards.'
      },
      {
        label: 'Voluntary Support Diagnostics',
        text: 'If you encounter an issue and voluntarily use "Help → Send Report", strictly sanitized technical diagnostics (browser version, viewport dimensions, active tools, anonymous action counts) are collected. Pixel buffers, artwork images, personal files, and passwords are NEVER included.'
      },
      {
        label: 'Contact Email Usage',
        text: 'If you provide an email address within a support report, it will be used exclusively to reply to your inquiry and resolve the reported problem.'
      }
    ]
  },
  {
    id: 'intellectual_property',
    title: 'Intellectual Property & Copyright',
    category: '3. Intellectual Property',
    badge: 'Your Rights',
    summary: 'Ownership of user-created artwork and software rights.',
    paragraphs: [
      'We fully recognize and respect the intellectual property rights of artists and game creators.'
    ],
    bulletPoints: [
      {
        label: 'User Ownership',
        text: 'The user retains all rights that correspond to them over works created using OnePixel Studio. OnePixel Studio claims no ownership or royalties over such works.'
      },
      {
        label: 'Third-Party Content Responsibility',
        text: 'The user is responsible for securing all necessary rights and licenses for any third-party content imported, utilized, or incorporated into their projects.'
      },
      {
        label: 'Software Rights',
        text: 'The OnePixel Studio name, branding, logo, original code, UI components, and visual designs are protected by applicable intellectual property laws.'
      }
    ]
  },
  {
    id: 'licenses',
    title: 'Third-Party & Open Source Licenses',
    category: '4. Open Source',
    badge: 'Transparency',
    summary: 'Full list of open source software libraries used in OnePixel Studio.',
    paragraphs: [
      'OnePixel Studio relies on reputable open-source libraries developed by the global software engineering community. We express our deepest gratitude to all authors and contributors.'
    ]
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer & Limitation of Liability',
    category: '5. Legal Disclaimers',
    badge: 'Notice',
    summary: 'Warranty disclaimers, liability limitations, and backup recommendations.',
    paragraphs: [
      'OnePixel Studio is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied, including fitness for a particular purpose.',
      'To the maximum extent permitted by applicable law, OnePixel Studio and its contributors shall not be liable for any data loss, project corruption, or incidental damages resulting from the use or inability to use the software. Users are advised to regularly backup project files (.onepixel).'
    ]
  },
  {
    id: 'donations',
    title: 'Donations & Voluntary Support',
    category: '6. Donations',
    badge: 'Voluntary Support',
    summary: 'Information regarding voluntary project contributions through official platforms.',
    paragraphs: [
      'OnePixel Studio is an independent and free project. Voluntary financial donations made through our official platforms constitute voluntary contributions and do not grant any ownership, equity, or control rights over the software. Donations contribute to the maintenance, development, enhancement, and operation of OnePixel Studio.',
      'All donations are processed securely by the external platform PayPal (PayPal Holdings, Inc.). OnePixel Studio does not process, store, or access credit card details or banking credentials. Transactions are subject to PayPal terms and privacy policies.'
    ]
  },
  {
    id: 'contact',
    title: 'Contact & Official Support Channel',
    category: '7. Contact',
    badge: 'User Support',
    summary: 'Official channels for support, bug reports, privacy inquiries, and legal notices.',
    paragraphs: [
      `For technical support, feature suggestions, privacy inquiries, or legal communications, please contact our official channel:`,
      `Official Email: ${OFFICIAL_LEGAL_EMAIL}`,
      'We are committed to reviewing every inquiry promptly with professionalism and transparency.'
    ]
  }
];

// ------------------------------------------------------------------------------------------------
// CONTENIDOS EN PORTUGUÊS (PT)
// ------------------------------------------------------------------------------------------------
const LEGAL_SECTIONS_PT: LegalSection[] = [
  {
    id: 'terms',
    title: 'Termos e Condições de Uso',
    category: '1. Termos de Serviço',
    badge: 'Uso do Software',
    summary: 'Termos e condições aplicáveis ao acesso e utilização do OnePixel Studio.',
    paragraphs: [
      `Bem-vindo ao OnePixel Studio (versão ${LEGAL_VERSION}, em vigor desde ${LEGAL_EFFECTIVE_DATE}). Ao utilizar nosso software, você concorda com estes Termos e Condições. Caso discorde, não utilize o aplicativo.`,
      `O OnePixel Studio é uma suíte de edição e animação pixel art concebida para execução local no ambiente do usuário (navegador). Destina-se à criação artística pessoal, educativa ou comercial de obras originais.`
    ],
    bulletPoints: [
      {
        label: 'Uso Permitido',
        text: 'Você pode utilizar o OnePixel Studio para criar, animar e exportar sprites e artes pixel art para fins pessoais e comerciais sem pagar royalties ao OnePixel Studio.'
      },
      {
        label: 'Responsabilidade do Usuário',
        text: 'O usuário é o único responsável pelo conteúdo que cria ou importa, bem como pela realização de backups periódicos de seus projetos (.onepixel).'
      },
      {
        label: 'Conduta Proibida',
        text: 'É proibido realizar engenharia reversa com fins maliciosos, injetar códigos prejudiciais ou utilizar o software para fins ilegais.'
      },
      {
        label: 'Atualizações',
        text: 'O OnePixel Studio pode receber atualizações e melhorias contínuas para aprimorar sua estabilidade e recursos.'
      }
    ]
  },
  {
    id: 'privacy',
    title: 'Política de Privacidade',
    category: '2. Privacidade e Dados',
    badge: 'Privacidade Garantida',
    summary: 'Compromisso com a privacidade: sem rastreamento publicitário e sem coleta rotineira de dados.',
    paragraphs: [
      'Os projetos, telas, quadros, camadas, configurações e preferências do OnePixel Studio são armazenados localmente no dispositivo do usuário, exceto quando o próprio usuário decide explicitamente exportar, compartilhar ou enviar informações por meio de um recurso de suporte. O OnePixel Studio não realiza coleta automática de dados para fins de rastreamento, publicidade, criação de perfis ou análise comportamental.'
    ],
    bulletPoints: [
      {
        label: 'Uso Normal do Editor',
        text: 'Durante o uso padrão, o OnePixel Studio NÃO realiza rastreamento de anúncios, NÃO traça perfis de usuários, NÃO vende nem aluga dados pessoais a terceiros.'
      },
      {
        label: 'Projetos Locais',
        text: 'Seus desenhos, paletas, camadas e arquivos são processados e armazenados no armazenamento local de seu dispositivo, não sendo transmitidos automaticamente a servidores externos.'
      },
      {
        label: 'Sem Conta Obrigatória',
        text: 'Não é necessário criar uma conta nem fornecer dados bancários para utilizar o editor.'
      },
      {
        label: 'Relatório de Suporte Voluntário',
        text: 'Ao usar voluntariamente o recurso de suporte, apenas metadados técnicos sanitizados (versão do navegador, dimensões do canvas, ferramentas) são enviados. Pixels e imagens privadas NUNCA são incluídos.'
      }
    ]
  },
  {
    id: 'intellectual_property',
    title: 'Propriedade Intelectual e Direitos',
    category: '3. Propriedade Intelectual',
    badge: 'Seus Direitos',
    summary: 'Propriedade das criações do usuário e direitos sobre o software.',
    paragraphs: [
      'Reconhecemos e respeitamos integralmente os direitos autorais dos artistas e desenvolvedores.'
    ],
    bulletPoints: [
      {
        label: 'Titularidade do Usuário',
        text: 'O usuário conserva os direitos que lhe correspondam sobre as obras que criar utilizando o OnePixel Studio. O OnePixel Studio não reivindica a propriedade de tais obras nem exige pagamento de royalties.'
      },
      {
        label: 'Conteúdo de Terceiros',
        text: 'O usuário é responsável por possuir os direitos e licenças necessários sobre qualquer conteúdo de terceiros que importe ou utilize em seus projetos.'
      },
      {
        label: 'Direitos sobre o Software',
        text: 'A marca, o logotipo, o código fonte e o design do OnePixel Studio são protegidos pelas leis de propriedade intelectual aplicáveis.'
      }
    ]
  },
  {
    id: 'licenses',
    title: 'Licenças de Terceiros e Código Aberto',
    category: '4. Open Source',
    badge: 'Transparência',
    summary: 'Relação de bibliotecas de código aberto utilizadas no projeto.',
    paragraphs: [
      'O OnePixel Studio utiliza bibliotecas de código aberto consagradas. Agradecemos a todos os autores e mantenedores dos projetos parceiros.'
    ]
  },
  {
    id: 'disclaimer',
    title: 'Isenção de Responsabilidade',
    category: '5. Isenção Legal',
    badge: 'Aviso Legal',
    summary: 'Garantias do software e limitações de responsabilidade.',
    paragraphs: [
      'O software é fornecido "como está" (as is), sem garantias expressas ou implícitas. Na extensão máxima permitida por lei, o OnePixel Studio não se responsabiliza por perda de dados decorrente do uso do aplicativo. Recomendamos manter backups regulares.'
    ]
  },
  {
    id: 'donations',
    title: 'Doações e Apoio Voluntário',
    category: '6. Doações',
    badge: 'Apoio Voluntário',
    summary: 'Informações sobre contribuições voluntárias por meio de plataformas oficiais.',
    paragraphs: [
      'O OnePixel Studio é um projeto independente e gratuito. As doações financeiras voluntárias realizadas por meio de nossas plataformas oficiais constituem contribuições voluntárias e não conferem direitos de propriedade, participação ou controle sobre o software. As doações contribuem para a manutenção, desenvolvimento, aprimoramento e operação do OnePixel Studio.',
      'As doações são processadas de forma segura exclusivamente pela plataforma externa PayPal (PayPal Holdings, Inc.). O OnePixel Studio não coleta, não armazena e não tem acesso a informações bancárias ou números de cartão.'
    ]
  },
  {
    id: 'contact',
    title: 'Contato e Suporte Oficial',
    category: '7. Contato',
    badge: 'Atendimento',
    summary: 'Canais oficiais de comunicação e suporte técnico.',
    paragraphs: [
      `Para suporte técnico, dúvidas sobre privacidade ou questões legais, entre em contato pelo email oficial:`,
      `Email Oficial: ${OFFICIAL_LEGAL_EMAIL}`
    ]
  }
];

// ------------------------------------------------------------------------------------------------
// CONTENIDOS EN JAPONÉS (JA)
// ------------------------------------------------------------------------------------------------
const LEGAL_SECTIONS_JA: LegalSection[] = [
  {
    id: 'terms',
    title: '利用規約 (Terms of Use)',
    category: '1. 利用規約',
    badge: 'ソフトウェア利用',
    summary: 'OnePixel Studioの利用に関する基本条件および規則。',
    paragraphs: [
      `OnePixel Studio（バージョン ${LEGAL_VERSION}、発効日：${LEGAL_EFFECTIVE_DATE}）をご利用いただきありがとうございます。本ソフトウェアをご利用いただくことで、本利用規約に同意したものとみなされます。`,
      `OnePixel Studioは、主にユーザーのローカル環境（ブラウザ）上で動作するドット絵・ピクセルアート制作スイートです。個人、教育、商用利用を含むオリジナル作品の制作に幅広くご利用いただけます。`
    ],
    bulletPoints: [
      {
        label: '利用許諾',
        text: '作成したスプライト、イラスト、アニメーションは、ロイヤリティフリーで個人的・商用的に自由にご利用いただけます。'
      },
      {
        label: 'ユーザーの責任',
        text: '作成・インポートしたコンテンツおよびプロジェクトファイル（.onepixel）のバックアップ管理は、ユーザー自身の責任となります。'
      },
      {
        label: '禁止事項',
        text: '悪意あるリバースエンジニアリング、不正コードの注入、サポートサーバーへの攻撃行為を禁じます。'
      }
    ]
  },
  {
    id: 'privacy',
    title: 'プライバシーポリシー (Privacy Policy)',
    category: '2. プライバシーとデータ',
    badge: 'プライバシー保護',
    summary: 'ローカル優先のプライバシー方針：広告追跡なし、プロジェクトの自動収集なし。',
    paragraphs: [
      'OnePixel Studioのプロジェクト、キャンバス、フレーム、レイヤー、設定および環境設定は、ユーザーがサポート機能等を通じて明示的にエクスポート、共有、または送信することを選択した場合を除き、ユーザーのデバイス上にローカルに保存されます。OnePixel Studioは、追跡、広告、プロファイリング、または行動分析を目的とした自動データ収集を行いません。'
    ],
    bulletPoints: [
      {
        label: '通常使用時',
        text: '広告トラッキング、プロファイリング、個人データの第三者への販売・賃貸は一切行いません。'
      },
      {
        label: 'プロジェクトデータのローカル処理',
        text: '描画データ、パレット、レイヤー、画像ファイルはお使いのデバイスで処理・保存され、外部サーバーに自動送信されることはありません。'
      },
      {
        label: 'アカウント登録不要',
        text: '本エディタのご利用にあたり、個人情報やクレジットカードの登録は不要です。'
      },
      {
        label: 'サポート送信時',
        text: '任意でサポートレポートを送信される場合のみ、診断用の技術情報（ブラウザ環境等）が送信されます。描画ピクセルやパスワードが含まれることはありません。'
      }
    ]
  },
  {
    id: 'intellectual_property',
    title: '知的財産権および著作権',
    category: '3. 知的財産権',
    badge: 'ユーザーの権利',
    summary: '作成されたコンテンツの権利および本ソフトウェアの保護。',
    paragraphs: [
      'ユーザーがOnePixel Studioを使用して作成した作品に関する権利はユーザー自身に帰属します。OnePixel Studioが当該作品の所有権やロイヤリティを主張することはありません。ユーザーは、プロジェクトにインポートまたは組み込む第三者コンテンツに必要な権利およびライセンスを確保する責任を負います。'
    ]
  },
  {
    id: 'licenses',
    title: 'サードパーティおよびオープンソースライセンス',
    category: '4. オープンソース',
    badge: '透明性',
    summary: '使用されているオープンソースソフトウェアの一覧。',
    paragraphs: [
      'OnePixel Studioは、世界中の開発者コミュニティによって支えられている優れたオープンソースライブラリを活用しています。各開発者に深く感謝いたします。'
    ]
  },
  {
    id: 'disclaimer',
    title: '免責事項 (Disclaimer)',
    category: '5. 法的免責事項',
    badge: '免責事項',
    summary: 'ソフトウェアの保証範囲とデータ損失に関する責任制限。',
    paragraphs: [
      '本ソフトウェアは「現状有姿」で提供され、明示または黙示の保証はありません。法律で認められる最大限の範囲において、データ消失等の損害に対して責任を負いません。定期的なバックアップを推奨します。'
    ]
  },
  {
    id: 'donations',
    title: '寄付および任意サポート',
    category: '6. 寄付',
    badge: '任意サポート',
    summary: '公式プラットフォームを通じた任意の寄付に関するご案内。',
    paragraphs: [
      'OnePixel Studioは独立した無料プロジェクトです。公式プラットフォームを通じて行われる任意の寄付は自発的な支援であり、ソフトウェアに対する所有権、持分、または管理権を付与するものではありません。寄付金はOnePixel Studioの保守、開発、機能向上および運用に役立てられます。',
      '寄付はPayPalを通じて安全に処理されます。OnePixel Studioはクレジットカード番号等の金融情報を直接取得・保管いたしません。'
    ]
  },
  {
    id: 'contact',
    title: 'お問い合わせ・公式サポート窓口',
    category: '7. お問い合わせ',
    badge: '公式サポート',
    summary: '公式サポート、プライバシーおよび法的なご連絡窓口。',
    paragraphs: [
      `技術サポートや法的なお問い合わせは、以下の公式メールアドレスまでご連絡ください：`,
      `公式メール: ${OFFICIAL_LEGAL_EMAIL}`
    ]
  }
];

// ------------------------------------------------------------------------------------------------
// CONTENIDOS EN RUSO (RU)
// ------------------------------------------------------------------------------------------------
const LEGAL_SECTIONS_RU: LegalSection[] = [
  {
    id: 'terms',
    title: 'Условия использования',
    category: '1. Условия сервиса',
    badge: 'Использование ПО',
    summary: 'Условия, регулирующие использование приложения OnePixel Studio.',
    paragraphs: [
      `Добро пожаловать в OnePixel Studio (версия ${LEGAL_VERSION}, действует с ${LEGAL_EFFECTIVE_DATE}). Используя наше приложение, вы соглашаетесь соблюдать настоящие Условия.`,
      `OnePixel Studio — это редактор пиксельной графики и анимации, работающий локально в браузере пользователя для создания оригинальных творческих работ.`
    ],
    bulletPoints: [
      {
        label: 'Разрешенное использование',
        text: 'Вы можете использовать созданные спрайты и иллюстрации в личных и коммерческих проектах без выплаты роялти OnePixel Studio.'
      },
      {
        label: 'Ответственность пользователя',
        text: 'Пользователь несет полную ответственность за созданный контент и резервное копирование файлов проектов (.onepixel).'
      }
    ]
  },
  {
    id: 'privacy',
    title: 'Политика конфиденциальности',
    category: '2. Конфиденциальность',
    badge: 'Защита данных',
    summary: 'Локальная конфиденциальность: отсутствие рекламного трекинга и регулярного сбора данных.',
    paragraphs: [
      'Проекты, холсты, кадры, слои, настройки и параметры OnePixel Studio хранятся локально на устройстве пользователя, за исключением случаев, когда сам пользователь явно решает экспортировать, делиться или отправлять информацию с помощью функции поддержки. OnePixel Studio не осуществляет автоматический сбор данных в целях отслеживания, рекламы, профилирования или поведенческой аналитики.'
    ],
    bulletPoints: [
      {
        label: 'Обычное использование',
        text: 'OnePixel Studio НЕ использует рекламный трекинг, НЕ собирает личные профили и НЕ продает данные третьим лицам.'
      },
      {
        label: 'Локальное хранение',
        text: 'Ваши рисунки, палитры и файлы проектов обрабатываются и хранятся локально и не передаются автоматически на внешние серверы.'
      },
      {
        label: 'Отчеты о поддержке',
        text: 'При добровольной отправке отчета передаются только технические диагностические метаданные. Пиксели и пароли НЕ собираются.'
      }
    ]
  },
  {
    id: 'intellectual_property',
    title: 'Интеллектуальная собственность',
    category: '3. Интеллектуальная собственность',
    badge: 'Права автора',
    summary: 'Права на созданные произведения и защита программного обеспечения.',
    paragraphs: [
      'Пользователь сохраняет все причитающиеся ему права на произведения, созданные с использованием OnePixel Studio. OnePixel Studio не претендует на право собственности или роялти на такие произведения. Пользователь несет ответственность за наличие необходимых прав и лицензий на любые материалы третьих лиц, импортируемые или используемые в проектах.'
    ]
  },
  {
    id: 'licenses',
    title: 'Сторонние лицензии и Open Source',
    category: '4. Open Source',
    badge: 'Прозрачность',
    summary: 'Список библиотек с открытым исходным кодом, используемых в приложении.',
    paragraphs: [
      'OnePixel Studio использует проверенные открытые библиотеки. Мы выражаем благодарность их разработчикам.'
    ]
  },
  {
    id: 'disclaimer',
    title: 'Отказ от ответственности',
    category: '5. Ограничение ответственности',
    badge: 'Правовое уведомление',
    summary: 'Предоставление ПО «как есть» и рекомендации по сохранению данных.',
    paragraphs: [
      'Программное обеспечение предоставляется по принципу «как есть» (as is). В максимально разрешенной законом степени мы не несем ответственности за потерю данных.'
    ]
  },
  {
    id: 'donations',
    title: 'Пожертвования и поддержка',
    category: '6. Пожертвования',
    badge: 'Поддержка проекта',
    summary: 'Информация о добровольных пожертвованиях через официальные платформы.',
    paragraphs: [
      'OnePixel Studio — это независимый и бесплатный проект. Добровольные пожертвования, сделанные через наши официальные платформы, являются добровольными взносами и не предоставляют прав собственности, участия или контроля над программным обеспечением. Пожертвования способствуют поддержке, разработке, улучшению и функционированию OnePixel Studio.',
      'Пожертвования обрабатываются через внешнюю систему PayPal (PayPal Holdings, Inc.). OnePixel Studio не хранит и не имеет доступа к банковским данным или номерам карт.'
    ]
  },
  {
    id: 'contact',
    title: 'Контакты и официальная поддержка',
    category: '7. Контакты',
    badge: 'Поддержка',
    summary: 'Официальный канал для обращений и технической помощи.',
    paragraphs: [
      `Официальный адрес электронной почты для связи и поддержки:`,
      `Email: ${OFFICIAL_LEGAL_EMAIL}`
    ]
  }
];

// ------------------------------------------------------------------------------------------------
// CONTENIDOS EN CHINO SIMPLIFICADO (ZH-CN)
// ------------------------------------------------------------------------------------------------
const LEGAL_SECTIONS_ZH: LegalSection[] = [
  {
    id: 'terms',
    title: '使用条款 (Terms of Service)',
    category: '1. 服务条款',
    badge: '软件使用',
    summary: '关于访问和使用 OnePixel Studio 的基本条款与规范。',
    paragraphs: [
      `欢迎使用 OnePixel Studio（版本号 ${LEGAL_VERSION}，生效日期：${LEGAL_EFFECTIVE_DATE}）。使用本软件即表示您同意遵守本条款。`,
      `OnePixel Studio 是一款专注于本地环境（浏览器客户端）运行的像素画绘制与动画创作套件，适用于个人、教育及商业原创作品创作。`
    ],
    bulletPoints: [
      {
        label: '许可范围',
        text: '您可以将使用本软件创作的像素精灵、图案和动画用于个人或商业项目，无需向 OnePixel Studio 支付版税。'
      },
      {
        label: '用户责任',
        text: '用户须对其创作或导入的内容负全责，并自行对项目工程文件（.onepixel）进行定期备份。'
      }
    ]
  },
  {
    id: 'privacy',
    title: '隐私政策 (Privacy Policy)',
    category: '2. 隐私与数据安全',
    badge: '隐私保障',
    summary: '本地优先隐私承诺：无广告追踪，非自愿不上传数据。',
    paragraphs: [
      'OnePixel Studio 的项目、画布、帧、图层、设置和首选项均存储在用户的本地设备中，除非用户明确选择通过支持功能导出、共享或发送信息。OnePixel Studio 不会出于追踪、广告、用户画像或行为分析目的进行自动数据收集。'
    ],
    bulletPoints: [
      {
        label: '常规编辑状态',
        text: '在正常使用期间，OnePixel Studio 不进行广告追踪、不进行用户画像、绝不出售或出租个人数据。'
      },
      {
        label: '项目本地化',
        text: '您的像素画、调色板、图层和项目文件在本地设备处理与保存，绝不会自动上传至云端或第三方服务器。'
      },
      {
        label: '自愿支持报告',
        text: '仅在您主动提交“帮助 → 发送报告”时，才会收集经过脱敏的技术诊断信息。绝不包含绘图像素、密码或私人文件。'
      }
    ]
  },
  {
    id: 'intellectual_property',
    title: '知识产权与版权声明',
    category: '3. 知识产权',
    badge: '作者权益',
    summary: '用户创作内容权利声明及软件保护。',
    paragraphs: [
      '用户保留使用 OnePixel Studio 创作的作品所应享有的各项权利。OnePixel Studio 不会对这些作品主张所有权或版税。用户有责任确保对其导入、使用或纳入项目的任何第三方内容拥有必要的权利和许可。'
    ]
  },
  {
    id: 'licenses',
    title: '第三方与开源软件许可',
    category: '4. 开源许可',
    badge: '透明度',
    summary: '本项目使用的所有第三方开源软件及授权协议一览。',
    paragraphs: [
      'OnePixel Studio 依托于全球开发者社区的优秀开源项目。我们向所有开源作者和维护者致以由衷的敬意。'
    ]
  },
  {
    id: 'disclaimer',
    title: '免责声明 (Disclaimer)',
    category: '5. 法律免责',
    badge: '法律声明',
    summary: '软件“按现状”提供，用户应注意定期备份。',
    paragraphs: [
      '本软件按“现状”提供，在法律允许的最大限度内，不对因使用本软件造成的任何数据丢失承担附带赔偿责任。'
    ]
  },
  {
    id: 'donations',
    title: '赞助与志愿支持',
    category: '6. 赞助支持',
    badge: '自愿支持',
    summary: '关于通过官方平台进行自愿捐赠的说明。',
    paragraphs: [
      'OnePixel Studio 是一个独立的免费项目。通过我们官方平台进行的自愿赞助和捐赠属于自愿贡献，不赋予对本软件的任何所有权、股份或控制权。捐赠款项有助于 OnePixel Studio 的日常维护、功能开发、持续改进与稳定运行。',
      '捐赠全程由外部支付平台 PayPal 处理。OnePixel Studio 绝不获取、存储或访问用户的银行卡号等金融信息。'
    ]
  },
  {
    id: 'contact',
    title: '联系方式与官方支持渠道',
    category: '7. 联系我们',
    badge: '官方支持',
    summary: '用于技术支持、隐私咨询和法律事务的官方联系渠道。',
    paragraphs: [
      `如需技术支持、功能建议或法律咨询，请通过官方支持邮箱联系我们：`,
      `官方邮箱: ${OFFICIAL_LEGAL_EMAIL}`
    ]
  }
];

/**
 * Returns the legal documentation sections translated for the given language.
 */
export function getLegalSections(lang: LanguageCode = 'es'): LegalSection[] {
  switch (lang) {
    case 'en':
      return LEGAL_SECTIONS_EN;
    case 'pt':
      return LEGAL_SECTIONS_PT;
    case 'ja':
      return LEGAL_SECTIONS_JA;
    case 'ru':
      return LEGAL_SECTIONS_RU;
    case 'zh-CN':
      return LEGAL_SECTIONS_ZH;
    case 'es':
    default:
      return LEGAL_SECTIONS_ES;
  }
}
