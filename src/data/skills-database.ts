import { COMPREHENSIVE_SKILLS_EXPANSION } from './comprehensive-skills-expansion';

export interface Skill {
  id: string;              // Canonical lowercase name: 'react'
  name: string;            // Display name: 'React'
  category: SkillCategory;
  synonyms: string[];      // ['react.js', 'reactjs', 'react js']
  popularity?: number;     // 1-100, prioritize popular skills
}

export type SkillCategory =
  // Tech (existing)
  | 'programming-language'
  | 'frontend-framework'
  | 'backend-framework'
  | 'database'
  | 'cloud-platform'
  | 'devops-tool'
  | 'testing-framework'
  | 'methodology'
  // Healthcare
  | 'medical-skill'
  | 'healthcare-system'
  | 'medical-certification'
  // Business & Finance
  | 'financial-skill'
  | 'accounting-tool'
  | 'business-analysis'
  | 'financial-certification'
  // HR
  | 'hr-skill'
  | 'hr-system'
  | 'hr-certification'
  // Sales
  | 'sales-skill'
  | 'crm-tool'
  | 'sales-methodology'
  // Marketing
  | 'marketing-skill'
  | 'marketing-tool'
  | 'analytics-platform'
  | 'marketing-certification'
  // Customer Service
  | 'customer-service-skill'
  | 'support-tool'
  | 'customer-service-certification'
  // Retail & Ecommerce
  | 'retail-skill'
  | 'ecommerce-platform'
  | 'pos-system'
  // Education
  | 'instructional-design'
  | 'lms-platform'
  | 'elearning-tool'
  | 'education-certification'
  // Legal
  | 'legal-skill'
  | 'legal-software'
  | 'compliance-framework'
  | 'legal-certification'
  // Engineering (non-software)
  | 'cad-software'
  | 'engineering-skill'
  | 'engineering-certification'
  // Universal
  | 'soft-skill'
  | 'certification'
  | 'other';

export const SKILLS_DATA: Skill[] = [
  // Programming Languages (50)
  {
    id: 'python',
    name: 'Python',
    category: 'programming-language',
    synonyms: ['py', 'python3', 'python 3'],
    popularity: 95
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    category: 'programming-language',
    synonyms: ['js', 'javascript es6', 'ecmascript', 'es6'],
    popularity: 98
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'programming-language',
    synonyms: ['ts', 'typescript lang'],
    popularity: 92
  },
  {
    id: 'java',
    name: 'Java',
    category: 'programming-language',
    synonyms: ['java se', 'java ee', 'jdk'],
    popularity: 90
  },
  {
    id: 'c++',
    name: 'C++',
    category: 'programming-language',
    synonyms: ['cpp', 'c plus plus', 'cplusplus'],
    popularity: 85
  },
  {
    id: 'c#',
    name: 'C#',
    category: 'programming-language',
    synonyms: ['csharp', 'c sharp', 'c-sharp'],
    popularity: 82
  },
  {
    id: 'go',
    name: 'Go',
    category: 'programming-language',
    synonyms: ['golang', 'go lang'],
    popularity: 88
  },
  {
    id: 'rust',
    name: 'Rust',
    category: 'programming-language',
    synonyms: ['rust lang', 'rust-lang'],
    popularity: 78
  },
  {
    id: 'php',
    name: 'PHP',
    category: 'programming-language',
    synonyms: ['php7', 'php8', 'php 7', 'php 8'],
    popularity: 75
  },
  {
    id: 'ruby',
    name: 'Ruby',
    category: 'programming-language',
    synonyms: ['ruby lang', 'ruby on rails'],
    popularity: 72
  },
  {
    id: 'swift',
    name: 'Swift',
    category: 'programming-language',
    synonyms: ['swift lang', 'swift language'],
    popularity: 80
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    category: 'programming-language',
    synonyms: ['kotlin lang', 'kotlin language'],
    popularity: 79
  },
  {
    id: 'scala',
    name: 'Scala',
    category: 'programming-language',
    synonyms: ['scala lang', 'scala language'],
    popularity: 68
  },
  {
    id: 'r',
    name: 'R',
    category: 'programming-language',
    synonyms: ['r lang', 'r language', 'r programming'],
    popularity: 70
  },
  {
    id: 'matlab',
    name: 'MATLAB',
    category: 'programming-language',
    synonyms: ['matlab language', 'mat lab'],
    popularity: 65
  },
  {
    id: 'perl',
    name: 'Perl',
    category: 'programming-language',
    synonyms: ['perl5', 'perl 5'],
    popularity: 55
  },
  {
    id: 'shell',
    name: 'Shell',
    category: 'programming-language',
    synonyms: ['bash', 'shell scripting', 'bash scripting', 'sh'],
    popularity: 82
  },
  {
    id: 'powershell',
    name: 'PowerShell',
    category: 'programming-language',
    synonyms: ['power shell', 'pwsh', 'powershell core'],
    popularity: 70
  },
  {
    id: 'sql',
    name: 'SQL',
    category: 'programming-language',
    synonyms: ['structured query language', 'sql queries'],
    popularity: 94
  },
  {
    id: 'objective-c',
    name: 'Objective-C',
    category: 'programming-language',
    synonyms: ['objc', 'objective c'],
    popularity: 60
  },
  {
    id: 'dart',
    name: 'Dart',
    category: 'programming-language',
    synonyms: ['dart lang', 'dart language'],
    popularity: 74
  },
  {
    id: 'elixir',
    name: 'Elixir',
    category: 'programming-language',
    synonyms: ['elixir lang', 'elixir language'],
    popularity: 64
  },
  {
    id: 'haskell',
    name: 'Haskell',
    category: 'programming-language',
    synonyms: ['haskell lang', 'haskell language'],
    popularity: 58
  },
  {
    id: 'clojure',
    name: 'Clojure',
    category: 'programming-language',
    synonyms: ['clojure lang', 'clojure language'],
    popularity: 60
  },
  {
    id: 'lua',
    name: 'Lua',
    category: 'programming-language',
    synonyms: ['lua lang', 'lua language'],
    popularity: 62
  },
  {
    id: 'groovy',
    name: 'Groovy',
    category: 'programming-language',
    synonyms: ['groovy lang', 'groovy language'],
    popularity: 63
  },
  {
    id: 'f#',
    name: 'F#',
    category: 'programming-language',
    synonyms: ['fsharp', 'f sharp', 'f-sharp'],
    popularity: 59
  },
  {
    id: 'vba',
    name: 'VBA',
    category: 'programming-language',
    synonyms: ['visual basic', 'vb', 'visual basic for applications'],
    popularity: 50
  },
  {
    id: 'solidity',
    name: 'Solidity',
    category: 'programming-language',
    synonyms: ['solidity lang', 'solidity language'],
    popularity: 67
  },
  {
    id: 'assembly',
    name: 'Assembly',
    category: 'programming-language',
    synonyms: ['asm', 'assembly language', 'assembler'],
    popularity: 52
  },
  {
    id: 'c',
    name: 'C',
    category: 'programming-language',
    synonyms: ['c lang', 'c language', 'ansi c'],
    popularity: 81
  },
  {
    id: 'fortran',
    name: 'Fortran',
    category: 'programming-language',
    synonyms: ['fortran lang', 'fortran language'],
    popularity: 48
  },
  {
    id: 'cobol',
    name: 'COBOL',
    category: 'programming-language',
    synonyms: ['cobol lang', 'cobol language'],
    popularity: 45
  },
  {
    id: 'julia',
    name: 'Julia',
    category: 'programming-language',
    synonyms: ['julia lang', 'julia language'],
    popularity: 66
  },
  {
    id: 'racket',
    name: 'Racket',
    category: 'programming-language',
    synonyms: ['racket lang', 'racket language'],
    popularity: 54
  },
  {
    id: 'erlang',
    name: 'Erlang',
    category: 'programming-language',
    synonyms: ['erlang lang', 'erlang language'],
    popularity: 61
  },
  {
    id: 'ocaml',
    name: 'OCaml',
    category: 'programming-language',
    synonyms: ['ocaml lang', 'ocaml language'],
    popularity: 56
  },
  {
    id: 'nim',
    name: 'Nim',
    category: 'programming-language',
    synonyms: ['nim lang', 'nim language'],
    popularity: 57
  },
  {
    id: 'crystal',
    name: 'Crystal',
    category: 'programming-language',
    synonyms: ['crystal lang', 'crystal language'],
    popularity: 58
  },
  {
    id: 'zig',
    name: 'Zig',
    category: 'programming-language',
    synonyms: ['zig lang', 'zig language'],
    popularity: 65
  },
  {
    id: 'v',
    name: 'V',
    category: 'programming-language',
    synonyms: ['vlang', 'v lang', 'v language'],
    popularity: 55
  },
  {
    id: 'verilog',
    name: 'Verilog',
    category: 'programming-language',
    synonyms: ['verilog hdl', 'verilog language'],
    popularity: 53
  },
  {
    id: 'vhdl',
    name: 'VHDL',
    category: 'programming-language',
    synonyms: ['vhdl language', 'vhsic hardware description language'],
    popularity: 52
  },
  {
    id: 'coffeescript',
    name: 'CoffeeScript',
    category: 'programming-language',
    synonyms: ['coffee script', 'coffee'],
    popularity: 51
  },
  {
    id: 'elm',
    name: 'Elm',
    category: 'programming-language',
    synonyms: ['elm lang', 'elm language'],
    popularity: 59
  },
  {
    id: 'purescript',
    name: 'PureScript',
    category: 'programming-language',
    synonyms: ['pure script', 'purescript lang'],
    popularity: 56
  },
  {
    id: 'reasonml',
    name: 'ReasonML',
    category: 'programming-language',
    synonyms: ['reason', 'reason ml', 'reasonml lang'],
    popularity: 60
  },
  {
    id: 'hack',
    name: 'Hack',
    category: 'programming-language',
    synonyms: ['hack lang', 'hacklang', 'hhvm'],
    popularity: 57
  },
  {
    id: 'abap',
    name: 'ABAP',
    category: 'programming-language',
    synonyms: ['abap lang', 'sap abap'],
    popularity: 49
  },
  {
    id: 'apex',
    name: 'Apex',
    category: 'programming-language',
    synonyms: ['salesforce apex', 'apex language'],
    popularity: 62
  },

  // Frontend Frameworks (30)
  {
    id: 'react',
    name: 'React',
    category: 'frontend-framework',
    synonyms: ['react.js', 'reactjs', 'react js'],
    popularity: 97
  },
  {
    id: 'vue',
    name: 'Vue',
    category: 'frontend-framework',
    synonyms: ['vue.js', 'vuejs', 'vue js'],
    popularity: 89
  },
  {
    id: 'angular',
    name: 'Angular',
    category: 'frontend-framework',
    synonyms: ['angularjs', 'angular.js', 'angular 2+'],
    popularity: 86
  },
  {
    id: 'svelte',
    name: 'Svelte',
    category: 'frontend-framework',
    synonyms: ['svelte.js', 'sveltejs', 'svelte js'],
    popularity: 83
  },
  {
    id: 'next.js',
    name: 'Next.js',
    category: 'frontend-framework',
    synonyms: ['nextjs', 'next js', 'next'],
    popularity: 94
  },
  {
    id: 'nuxt',
    name: 'Nuxt',
    category: 'frontend-framework',
    synonyms: ['nuxt.js', 'nuxtjs', 'nuxt js'],
    popularity: 81
  },
  {
    id: 'gatsby',
    name: 'Gatsby',
    category: 'frontend-framework',
    synonyms: ['gatsby.js', 'gatsbyjs', 'gatsby js'],
    popularity: 77
  },
  {
    id: 'ember',
    name: 'Ember',
    category: 'frontend-framework',
    synonyms: ['ember.js', 'emberjs', 'ember js'],
    popularity: 68
  },
  {
    id: 'backbone',
    name: 'Backbone',
    category: 'frontend-framework',
    synonyms: ['backbone.js', 'backbonejs', 'backbone js'],
    popularity: 60
  },
  {
    id: 'preact',
    name: 'Preact',
    category: 'frontend-framework',
    synonyms: ['preact.js', 'preactjs', 'preact js'],
    popularity: 75
  },
  {
    id: 'solid',
    name: 'Solid',
    category: 'frontend-framework',
    synonyms: ['solid.js', 'solidjs', 'solid js'],
    popularity: 79
  },
  {
    id: 'alpine.js',
    name: 'Alpine.js',
    category: 'frontend-framework',
    synonyms: ['alpine', 'alpinejs', 'alpine js'],
    popularity: 74
  },
  {
    id: 'htmx',
    name: 'HTMX',
    category: 'frontend-framework',
    synonyms: ['htmx.org', 'htmx library'],
    popularity: 76
  },
  {
    id: 'qwik',
    name: 'Qwik',
    category: 'frontend-framework',
    synonyms: ['qwik.js', 'qwikjs', 'qwik framework'],
    popularity: 72
  },
  {
    id: 'astro',
    name: 'Astro',
    category: 'frontend-framework',
    synonyms: ['astro.build', 'astro framework'],
    popularity: 80
  },
  {
    id: 'remix',
    name: 'Remix',
    category: 'frontend-framework',
    synonyms: ['remix.run', 'remix framework'],
    popularity: 82
  },
  {
    id: 'lit',
    name: 'Lit',
    category: 'frontend-framework',
    synonyms: ['lit-element', 'lit-html', 'lit framework'],
    popularity: 71
  },
  {
    id: 'stencil',
    name: 'Stencil',
    category: 'frontend-framework',
    synonyms: ['stencil.js', 'stenciljs'],
    popularity: 69
  },
  {
    id: 'aurelia',
    name: 'Aurelia',
    category: 'frontend-framework',
    synonyms: ['aurelia.io', 'aurelia framework'],
    popularity: 64
  },
  {
    id: 'mithril',
    name: 'Mithril',
    category: 'frontend-framework',
    synonyms: ['mithril.js', 'mithriljs'],
    popularity: 63
  },
  {
    id: 'marko',
    name: 'Marko',
    category: 'frontend-framework',
    synonyms: ['marko.js', 'markojs'],
    popularity: 62
  },
  {
    id: 'polymer',
    name: 'Polymer',
    category: 'frontend-framework',
    synonyms: ['polymer.js', 'polymerjs', 'polymer project'],
    popularity: 61
  },
  {
    id: 'knockout',
    name: 'Knockout',
    category: 'frontend-framework',
    synonyms: ['knockout.js', 'knockoutjs', 'ko.js'],
    popularity: 58
  },
  {
    id: 'inferno',
    name: 'Inferno',
    category: 'frontend-framework',
    synonyms: ['inferno.js', 'infernojs'],
    popularity: 65
  },
  {
    id: 'hyperapp',
    name: 'Hyperapp',
    category: 'frontend-framework',
    synonyms: ['hyper app', 'hyperapp.js'],
    popularity: 64
  },
  {
    id: 'petite-vue',
    name: 'Petite Vue',
    category: 'frontend-framework',
    synonyms: ['petite vue', 'petite-vue', 'petitevue'],
    popularity: 66
  },
  {
    id: 'react-native',
    name: 'React Native',
    category: 'frontend-framework',
    synonyms: ['reactnative', 'react native framework', 'rn'],
    popularity: 91
  },
  {
    id: 'flutter',
    name: 'Flutter',
    category: 'frontend-framework',
    synonyms: ['flutter framework', 'flutter sdk'],
    popularity: 88
  },
  {
    id: 'electron',
    name: 'Electron',
    category: 'frontend-framework',
    synonyms: ['electron.js', 'electronjs'],
    popularity: 84
  },
  {
    id: 'ionic',
    name: 'Ionic',
    category: 'frontend-framework',
    synonyms: ['ionic framework', 'ionic mobile'],
    popularity: 78
  },

  // Backend Frameworks (40)
  {
    id: 'express',
    name: 'Express',
    category: 'backend-framework',
    synonyms: ['express.js', 'expressjs', 'express js'],
    popularity: 93
  },
  {
    id: 'django',
    name: 'Django',
    category: 'backend-framework',
    synonyms: ['django framework', 'django python'],
    popularity: 90
  },
  {
    id: 'flask',
    name: 'Flask',
    category: 'backend-framework',
    synonyms: ['flask framework', 'flask python'],
    popularity: 87
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    category: 'backend-framework',
    synonyms: ['fast api', 'fastapi framework'],
    popularity: 89
  },
  {
    id: 'spring-boot',
    name: 'Spring Boot',
    category: 'backend-framework',
    synonyms: ['springboot', 'spring boot framework', 'spring'],
    popularity: 91
  },
  {
    id: 'nest.js',
    name: 'NestJS',
    category: 'backend-framework',
    synonyms: ['nestjs', 'nest js', 'nest'],
    popularity: 86
  },
  {
    id: 'ruby-on-rails',
    name: 'Ruby on Rails',
    category: 'backend-framework',
    synonyms: ['rails', 'ror', 'ruby rails'],
    popularity: 82
  },
  {
    id: 'laravel',
    name: 'Laravel',
    category: 'backend-framework',
    synonyms: ['laravel framework', 'laravel php'],
    popularity: 85
  },
  {
    id: 'asp.net',
    name: 'ASP.NET',
    category: 'backend-framework',
    synonyms: ['asp.net core', 'aspnet', 'asp net'],
    popularity: 84
  },
  {
    id: 'koa',
    name: 'Koa',
    category: 'backend-framework',
    synonyms: ['koa.js', 'koajs', 'koa js'],
    popularity: 76
  },
  {
    id: 'hapi',
    name: 'Hapi',
    category: 'backend-framework',
    synonyms: ['hapi.js', 'hapijs', 'hapi js'],
    popularity: 72
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    category: 'backend-framework',
    synonyms: ['phoenix framework', 'phoenix elixir'],
    popularity: 78
  },
  {
    id: 'gin',
    name: 'Gin',
    category: 'backend-framework',
    synonyms: ['gin-gonic', 'gin framework', 'gin go'],
    popularity: 83
  },
  {
    id: 'echo',
    name: 'Echo',
    category: 'backend-framework',
    synonyms: ['echo framework', 'echo go'],
    popularity: 77
  },
  {
    id: 'fiber',
    name: 'Fiber',
    category: 'backend-framework',
    synonyms: ['gofiber', 'fiber go', 'fiber framework'],
    popularity: 79
  },
  {
    id: 'actix',
    name: 'Actix',
    category: 'backend-framework',
    synonyms: ['actix-web', 'actix framework', 'actix rust'],
    popularity: 75
  },
  {
    id: 'rocket',
    name: 'Rocket',
    category: 'backend-framework',
    synonyms: ['rocket.rs', 'rocket framework', 'rocket rust'],
    popularity: 74
  },
  {
    id: 'axum',
    name: 'Axum',
    category: 'backend-framework',
    synonyms: ['axum framework', 'axum rust'],
    popularity: 76
  },
  {
    id: 'symfony',
    name: 'Symfony',
    category: 'backend-framework',
    synonyms: ['symfony framework', 'symfony php'],
    popularity: 80
  },
  {
    id: 'codeigniter',
    name: 'CodeIgniter',
    category: 'backend-framework',
    synonyms: ['code igniter', 'codeigniter php'],
    popularity: 70
  },
  {
    id: 'cakephp',
    name: 'CakePHP',
    category: 'backend-framework',
    synonyms: ['cake php', 'cakephp framework'],
    popularity: 68
  },
  {
    id: 'yii',
    name: 'Yii',
    category: 'backend-framework',
    synonyms: ['yii2', 'yii framework', 'yii php'],
    popularity: 69
  },
  {
    id: 'slim',
    name: 'Slim',
    category: 'backend-framework',
    synonyms: ['slim framework', 'slim php'],
    popularity: 67
  },
  {
    id: 'lumen',
    name: 'Lumen',
    category: 'backend-framework',
    synonyms: ['lumen framework', 'lumen php'],
    popularity: 71
  },
  {
    id: 'sails',
    name: 'Sails',
    category: 'backend-framework',
    synonyms: ['sails.js', 'sailsjs', 'sails js'],
    popularity: 73
  },
  {
    id: 'adonis',
    name: 'Adonis',
    category: 'backend-framework',
    synonyms: ['adonis.js', 'adonisjs', 'adonis js'],
    popularity: 75
  },
  {
    id: 'loopback',
    name: 'LoopBack',
    category: 'backend-framework',
    synonyms: ['loopback.js', 'loopbackjs', 'loop back'],
    popularity: 70
  },
  {
    id: 'meteor',
    name: 'Meteor',
    category: 'backend-framework',
    synonyms: ['meteor.js', 'meteorjs', 'meteor js'],
    popularity: 72
  },
  {
    id: 'grails',
    name: 'Grails',
    category: 'backend-framework',
    synonyms: ['grails framework', 'grails groovy'],
    popularity: 66
  },
  {
    id: 'play',
    name: 'Play',
    category: 'backend-framework',
    synonyms: ['play framework', 'playframework', 'play scala'],
    popularity: 71
  },
  {
    id: 'micronaut',
    name: 'Micronaut',
    category: 'backend-framework',
    synonyms: ['micronaut framework', 'micronaut java'],
    popularity: 73
  },
  {
    id: 'quarkus',
    name: 'Quarkus',
    category: 'backend-framework',
    synonyms: ['quarkus framework', 'quarkus java'],
    popularity: 77
  },
  {
    id: 'ktor',
    name: 'Ktor',
    category: 'backend-framework',
    synonyms: ['ktor framework', 'ktor kotlin'],
    popularity: 74
  },
  {
    id: 'bottle',
    name: 'Bottle',
    category: 'backend-framework',
    synonyms: ['bottle.py', 'bottle python'],
    popularity: 65
  },
  {
    id: 'tornado',
    name: 'Tornado',
    category: 'backend-framework',
    synonyms: ['tornado framework', 'tornado python'],
    popularity: 69
  },
  {
    id: 'falcon',
    name: 'Falcon',
    category: 'backend-framework',
    synonyms: ['falcon framework', 'falcon python'],
    popularity: 70
  },
  {
    id: 'aiohttp',
    name: 'aiohttp',
    category: 'backend-framework',
    synonyms: ['aio http', 'aiohttp python'],
    popularity: 72
  },
  {
    id: 'sinatra',
    name: 'Sinatra',
    category: 'backend-framework',
    synonyms: ['sinatra framework', 'sinatra ruby'],
    popularity: 68
  },
  {
    id: 'hanami',
    name: 'Hanami',
    category: 'backend-framework',
    synonyms: ['hanami framework', 'hanami ruby'],
    popularity: 64
  },
  {
    id: 'padrino',
    name: 'Padrino',
    category: 'backend-framework',
    synonyms: ['padrino framework', 'padrino ruby'],
    popularity: 63
  },

  // Databases (30)
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    category: 'database',
    synonyms: ['postgres', 'psql', 'pg'],
    popularity: 92
  },
  {
    id: 'mysql',
    name: 'MySQL',
    category: 'database',
    synonyms: ['my sql', 'mysql db'],
    popularity: 90
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'database',
    synonyms: ['mongo', 'mongo db'],
    popularity: 89
  },
  {
    id: 'redis',
    name: 'Redis',
    category: 'database',
    synonyms: ['redis db', 'redis cache'],
    popularity: 88
  },
  {
    id: 'cassandra',
    name: 'Cassandra',
    category: 'database',
    synonyms: ['apache cassandra', 'cassandra db'],
    popularity: 76
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    category: 'database',
    synonyms: ['sql lite', 'sqlite3'],
    popularity: 80
  },
  {
    id: 'mariadb',
    name: 'MariaDB',
    category: 'database',
    synonyms: ['maria db', 'mariadb database'],
    popularity: 78
  },
  {
    id: 'oracle',
    name: 'Oracle',
    category: 'database',
    synonyms: ['oracle db', 'oracle database', 'oracle rdbms'],
    popularity: 82
  },
  {
    id: 'mssql',
    name: 'MS SQL Server',
    category: 'database',
    synonyms: ['sql server', 'microsoft sql server', 'mssql', 't-sql'],
    popularity: 83
  },
  {
    id: 'dynamodb',
    name: 'DynamoDB',
    category: 'database',
    synonyms: ['dynamo db', 'aws dynamodb', 'amazon dynamodb'],
    popularity: 85
  },
  {
    id: 'couchdb',
    name: 'CouchDB',
    category: 'database',
    synonyms: ['couch db', 'apache couchdb'],
    popularity: 70
  },
  {
    id: 'neo4j',
    name: 'Neo4j',
    category: 'database',
    synonyms: ['neo4j graph', 'neo4j database'],
    popularity: 77
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    category: 'database',
    synonyms: ['elastic search', 'es', 'elasticsearch db'],
    popularity: 86
  },
  {
    id: 'couchbase',
    name: 'Couchbase',
    category: 'database',
    synonyms: ['couch base', 'couchbase server'],
    popularity: 72
  },
  {
    id: 'influxdb',
    name: 'InfluxDB',
    category: 'database',
    synonyms: ['influx db', 'influx database'],
    popularity: 74
  },
  {
    id: 'timescaledb',
    name: 'TimescaleDB',
    category: 'database',
    synonyms: ['timescale db', 'timescale'],
    popularity: 73
  },
  {
    id: 'rethinkdb',
    name: 'RethinkDB',
    category: 'database',
    synonyms: ['rethink db', 'rethink database'],
    popularity: 68
  },
  {
    id: 'arangodb',
    name: 'ArangoDB',
    category: 'database',
    synonyms: ['arango db', 'arango database'],
    popularity: 69
  },
  {
    id: 'firestore',
    name: 'Firestore',
    category: 'database',
    synonyms: ['firebase firestore', 'cloud firestore', 'google firestore'],
    popularity: 81
  },
  {
    id: 'fauna',
    name: 'FaunaDB',
    category: 'database',
    synonyms: ['fauna db', 'fauna database'],
    popularity: 71
  },
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'database',
    synonyms: ['supabase db', 'supabase database'],
    popularity: 79
  },
  {
    id: 'planetscale',
    name: 'PlanetScale',
    category: 'database',
    synonyms: ['planet scale', 'planetscale db'],
    popularity: 75
  },
  {
    id: 'cockroachdb',
    name: 'CockroachDB',
    category: 'database',
    synonyms: ['cockroach db', 'cockroach database'],
    popularity: 74
  },
  {
    id: 'memcached',
    name: 'Memcached',
    category: 'database',
    synonyms: ['mem cached', 'memcached cache'],
    popularity: 77
  },
  {
    id: 'ravendb',
    name: 'RavenDB',
    category: 'database',
    synonyms: ['raven db', 'raven database'],
    popularity: 67
  },
  {
    id: 'orientdb',
    name: 'OrientDB',
    category: 'database',
    synonyms: ['orient db', 'orient database'],
    popularity: 66
  },
  {
    id: 'dgraph',
    name: 'Dgraph',
    category: 'database',
    synonyms: ['d graph', 'dgraph database'],
    popularity: 68
  },
  {
    id: 'scylladb',
    name: 'ScyllaDB',
    category: 'database',
    synonyms: ['scylla db', 'scylla database'],
    popularity: 70
  },
  {
    id: 'yugabytedb',
    name: 'YugabyteDB',
    category: 'database',
    synonyms: ['yugabyte db', 'yugabyte'],
    popularity: 72
  },
  {
    id: 'clickhouse',
    name: 'ClickHouse',
    category: 'database',
    synonyms: ['click house', 'clickhouse db'],
    popularity: 76
  },

  // Cloud Platforms (20)
  {
    id: 'aws',
    name: 'AWS',
    category: 'cloud-platform',
    synonyms: ['amazon web services', 'amazon aws', 'aws cloud'],
    popularity: 96
  },
  {
    id: 'azure',
    name: 'Azure',
    category: 'cloud-platform',
    synonyms: ['microsoft azure', 'azure cloud', 'ms azure'],
    popularity: 92
  },
  {
    id: 'gcp',
    name: 'GCP',
    category: 'cloud-platform',
    synonyms: ['google cloud platform', 'google cloud', 'gcp cloud'],
    popularity: 90
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    category: 'cloud-platform',
    synonyms: ['digital ocean', 'do cloud'],
    popularity: 78
  },
  {
    id: 'heroku',
    name: 'Heroku',
    category: 'cloud-platform',
    synonyms: ['heroku platform', 'heroku cloud'],
    popularity: 80
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'cloud-platform',
    synonyms: ['vercel platform', 'vercel cloud'],
    popularity: 84
  },
  {
    id: 'netlify',
    name: 'Netlify',
    category: 'cloud-platform',
    synonyms: ['netlify platform', 'netlify cloud'],
    popularity: 82
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    category: 'cloud-platform',
    synonyms: ['cloudflare workers', 'cloudflare pages', 'cf'],
    popularity: 85
  },
  {
    id: 'railway',
    name: 'Railway',
    category: 'cloud-platform',
    synonyms: ['railway.app', 'railway platform'],
    popularity: 76
  },
  {
    id: 'render',
    name: 'Render',
    category: 'cloud-platform',
    synonyms: ['render.com', 'render platform'],
    popularity: 77
  },
  {
    id: 'fly.io',
    name: 'Fly.io',
    category: 'cloud-platform',
    synonyms: ['fly', 'flyio', 'fly platform'],
    popularity: 75
  },
  {
    id: 'linode',
    name: 'Linode',
    category: 'cloud-platform',
    synonyms: ['akamai linode', 'linode cloud'],
    popularity: 74
  },
  {
    id: 'vultr',
    name: 'Vultr',
    category: 'cloud-platform',
    synonyms: ['vultr cloud', 'vultr platform'],
    popularity: 72
  },
  {
    id: 'alibaba-cloud',
    name: 'Alibaba Cloud',
    category: 'cloud-platform',
    synonyms: ['aliyun', 'alibaba aliyun', 'alibaba cloud platform'],
    popularity: 73
  },
  {
    id: 'ibm-cloud',
    name: 'IBM Cloud',
    category: 'cloud-platform',
    synonyms: ['ibm cloud platform', 'ibm bluemix'],
    popularity: 71
  },
  {
    id: 'oracle-cloud',
    name: 'Oracle Cloud',
    category: 'cloud-platform',
    synonyms: ['oci', 'oracle cloud infrastructure'],
    popularity: 70
  },
  {
    id: 'openstack',
    name: 'OpenStack',
    category: 'cloud-platform',
    synonyms: ['open stack', 'openstack cloud'],
    popularity: 68
  },
  {
    id: 'cloudways',
    name: 'Cloudways',
    category: 'cloud-platform',
    synonyms: ['cloudways platform', 'cloudways hosting'],
    popularity: 67
  },
  {
    id: 'scaleway',
    name: 'Scaleway',
    category: 'cloud-platform',
    synonyms: ['scale way', 'scaleway cloud'],
    popularity: 69
  },
  {
    id: 'ovh',
    name: 'OVH',
    category: 'cloud-platform',
    synonyms: ['ovh cloud', 'ovhcloud'],
    popularity: 68
  },

  // DevOps Tools (50)
  {
    id: 'docker',
    name: 'Docker',
    category: 'devops-tool',
    synonyms: ['docker container', 'docker engine', 'dockerfile'],
    popularity: 95
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    category: 'devops-tool',
    synonyms: ['k8s', 'kube', 'k8s cluster'],
    popularity: 94
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    category: 'devops-tool',
    synonyms: ['jenkins ci', 'jenkins cd', 'jenkins pipeline'],
    popularity: 87
  },
  {
    id: 'github-actions',
    name: 'GitHub Actions',
    category: 'devops-tool',
    synonyms: ['gh actions', 'github action', 'gha'],
    popularity: 91
  },
  {
    id: 'gitlab-ci',
    name: 'GitLab CI',
    category: 'devops-tool',
    synonyms: ['gitlab ci/cd', 'gitlab pipeline', 'gitlab cicd'],
    popularity: 85
  },
  {
    id: 'circleci',
    name: 'CircleCI',
    category: 'devops-tool',
    synonyms: ['circle ci', 'circleci pipeline'],
    popularity: 81
  },
  {
    id: 'travis-ci',
    name: 'Travis CI',
    category: 'devops-tool',
    synonyms: ['travis', 'travisci', 'travis-ci'],
    popularity: 76
  },
  {
    id: 'terraform',
    name: 'Terraform',
    category: 'devops-tool',
    synonyms: ['terraform iac', 'terraform hcl', 'tf'],
    popularity: 90
  },
  {
    id: 'ansible',
    name: 'Ansible',
    category: 'devops-tool',
    synonyms: ['ansible automation', 'ansible playbook'],
    popularity: 86
  },
  {
    id: 'puppet',
    name: 'Puppet',
    category: 'devops-tool',
    synonyms: ['puppet automation', 'puppet labs'],
    popularity: 74
  },
  {
    id: 'chef',
    name: 'Chef',
    category: 'devops-tool',
    synonyms: ['chef automation', 'chef infra'],
    popularity: 72
  },
  {
    id: 'vagrant',
    name: 'Vagrant',
    category: 'devops-tool',
    synonyms: ['vagrant vm', 'vagrant box'],
    popularity: 75
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    category: 'devops-tool',
    synonyms: ['prometheus monitoring', 'prometheus metrics'],
    popularity: 84
  },
  {
    id: 'grafana',
    name: 'Grafana',
    category: 'devops-tool',
    synonyms: ['grafana dashboard', 'grafana monitoring'],
    popularity: 85
  },
  {
    id: 'datadog',
    name: 'Datadog',
    category: 'devops-tool',
    synonyms: ['datadog monitoring', 'datadog apm'],
    popularity: 82
  },
  {
    id: 'new-relic',
    name: 'New Relic',
    category: 'devops-tool',
    synonyms: ['newrelic', 'new relic apm'],
    popularity: 80
  },
  {
    id: 'splunk',
    name: 'Splunk',
    category: 'devops-tool',
    synonyms: ['splunk enterprise', 'splunk monitoring'],
    popularity: 79
  },
  {
    id: 'elk',
    name: 'ELK Stack',
    category: 'devops-tool',
    synonyms: ['elasticsearch logstash kibana', 'elk', 'elastic stack'],
    popularity: 83
  },
  {
    id: 'nagios',
    name: 'Nagios',
    category: 'devops-tool',
    synonyms: ['nagios monitoring', 'nagios core'],
    popularity: 73
  },
  {
    id: 'zabbix',
    name: 'Zabbix',
    category: 'devops-tool',
    synonyms: ['zabbix monitoring', 'zabbix server'],
    popularity: 72
  },
  {
    id: 'helm',
    name: 'Helm',
    category: 'devops-tool',
    synonyms: ['helm charts', 'helm k8s', 'helm kubernetes'],
    popularity: 84
  },
  {
    id: 'argocd',
    name: 'ArgoCD',
    category: 'devops-tool',
    synonyms: ['argo cd', 'argo continuous delivery'],
    popularity: 82
  },
  {
    id: 'flux',
    name: 'Flux',
    category: 'devops-tool',
    synonyms: ['flux cd', 'fluxcd', 'flux gitops'],
    popularity: 78
  },
  {
    id: 'spinnaker',
    name: 'Spinnaker',
    category: 'devops-tool',
    synonyms: ['spinnaker cd', 'spinnaker deployment'],
    popularity: 74
  },
  {
    id: 'packer',
    name: 'Packer',
    category: 'devops-tool',
    synonyms: ['hashicorp packer', 'packer io'],
    popularity: 76
  },
  {
    id: 'consul',
    name: 'Consul',
    category: 'devops-tool',
    synonyms: ['hashicorp consul', 'consul service mesh'],
    popularity: 77
  },
  {
    id: 'vault',
    name: 'Vault',
    category: 'devops-tool',
    synonyms: ['hashicorp vault', 'vault secrets'],
    popularity: 81
  },
  {
    id: 'nomad',
    name: 'Nomad',
    category: 'devops-tool',
    synonyms: ['hashicorp nomad', 'nomad orchestration'],
    popularity: 73
  },
  {
    id: 'istio',
    name: 'Istio',
    category: 'devops-tool',
    synonyms: ['istio service mesh', 'istio k8s'],
    popularity: 79
  },
  {
    id: 'linkerd',
    name: 'Linkerd',
    category: 'devops-tool',
    synonyms: ['linkerd service mesh', 'linkerd2'],
    popularity: 75
  },
  {
    id: 'nginx',
    name: 'Nginx',
    category: 'devops-tool',
    synonyms: ['nginx web server', 'nginx reverse proxy'],
    popularity: 89
  },
  {
    id: 'apache',
    name: 'Apache',
    category: 'devops-tool',
    synonyms: ['apache http server', 'apache web server', 'httpd'],
    popularity: 84
  },
  {
    id: 'haproxy',
    name: 'HAProxy',
    category: 'devops-tool',
    synonyms: ['ha proxy', 'haproxy load balancer'],
    popularity: 77
  },
  {
    id: 'traefik',
    name: 'Traefik',
    category: 'devops-tool',
    synonyms: ['traefik proxy', 'traefik load balancer'],
    popularity: 78
  },
  {
    id: 'envoy',
    name: 'Envoy',
    category: 'devops-tool',
    synonyms: ['envoy proxy', 'envoy service mesh'],
    popularity: 76
  },
  {
    id: 'sonarqube',
    name: 'SonarQube',
    category: 'devops-tool',
    synonyms: ['sonar qube', 'sonarqube scanner'],
    popularity: 80
  },
  {
    id: 'nexus',
    name: 'Nexus',
    category: 'devops-tool',
    synonyms: ['nexus repository', 'sonatype nexus'],
    popularity: 77
  },
  {
    id: 'artifactory',
    name: 'Artifactory',
    category: 'devops-tool',
    synonyms: ['jfrog artifactory', 'artifactory repository'],
    popularity: 78
  },
  {
    id: 'maven',
    name: 'Maven',
    category: 'devops-tool',
    synonyms: ['apache maven', 'maven build'],
    popularity: 82
  },
  {
    id: 'gradle',
    name: 'Gradle',
    category: 'devops-tool',
    synonyms: ['gradle build', 'gradle tool'],
    popularity: 83
  },
  {
    id: 'git',
    name: 'Git',
    category: 'devops-tool',
    synonyms: ['git vcs', 'git version control'],
    popularity: 98
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'devops-tool',
    synonyms: ['github platform', 'gh', 'github.com'],
    popularity: 96
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    category: 'devops-tool',
    synonyms: ['gitlab platform', 'gitlab.com'],
    popularity: 87
  },
  {
    id: 'bitbucket',
    name: 'Bitbucket',
    category: 'devops-tool',
    synonyms: ['bitbucket platform', 'atlassian bitbucket'],
    popularity: 79
  },
  {
    id: 'azure-devops',
    name: 'Azure DevOps',
    category: 'devops-tool',
    synonyms: ['azure devops services', 'ado', 'azure pipelines'],
    popularity: 83
  },
  {
    id: 'jira',
    name: 'Jira',
    category: 'devops-tool',
    synonyms: ['atlassian jira', 'jira software'],
    popularity: 88
  },
  {
    id: 'confluence',
    name: 'Confluence',
    category: 'devops-tool',
    synonyms: ['atlassian confluence', 'confluence wiki'],
    popularity: 80
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'devops-tool',
    synonyms: ['slack workspace', 'slack platform'],
    popularity: 86
  },
  {
    id: 'pagerduty',
    name: 'PagerDuty',
    category: 'devops-tool',
    synonyms: ['pager duty', 'pagerduty incident'],
    popularity: 78
  },
  {
    id: 'sentry',
    name: 'Sentry',
    category: 'devops-tool',
    synonyms: ['sentry.io', 'sentry error tracking'],
    popularity: 81
  },

  // Testing Frameworks (30)
  {
    id: 'jest',
    name: 'Jest',
    category: 'testing-framework',
    synonyms: ['jestjs', 'jest testing', 'jest framework'],
    popularity: 92
  },
  {
    id: 'pytest',
    name: 'Pytest',
    category: 'testing-framework',
    synonyms: ['py.test', 'pytest framework'],
    popularity: 89
  },
  {
    id: 'junit',
    name: 'JUnit',
    category: 'testing-framework',
    synonyms: ['junit5', 'junit 5', 'junit testing'],
    popularity: 88
  },
  {
    id: 'cypress',
    name: 'Cypress',
    category: 'testing-framework',
    synonyms: ['cypress.io', 'cypress testing', 'cypress e2e'],
    popularity: 90
  },
  {
    id: 'selenium',
    name: 'Selenium',
    category: 'testing-framework',
    synonyms: ['selenium webdriver', 'selenium automation'],
    popularity: 86
  },
  {
    id: 'mocha',
    name: 'Mocha',
    category: 'testing-framework',
    synonyms: ['mocha.js', 'mochajs', 'mocha testing'],
    popularity: 83
  },
  {
    id: 'jasmine',
    name: 'Jasmine',
    category: 'testing-framework',
    synonyms: ['jasmine.js', 'jasminejs', 'jasmine testing'],
    popularity: 80
  },
  {
    id: 'karma',
    name: 'Karma',
    category: 'testing-framework',
    synonyms: ['karma.js', 'karmajs', 'karma runner'],
    popularity: 77
  },
  {
    id: 'playwright',
    name: 'Playwright',
    category: 'testing-framework',
    synonyms: ['playwright testing', 'playwright automation'],
    popularity: 88
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer',
    category: 'testing-framework',
    synonyms: ['puppeteer testing', 'puppeteer automation'],
    popularity: 84
  },
  {
    id: 'testng',
    name: 'TestNG',
    category: 'testing-framework',
    synonyms: ['test ng', 'testng framework'],
    popularity: 79
  },
  {
    id: 'rspec',
    name: 'RSpec',
    category: 'testing-framework',
    synonyms: ['rspec testing', 'rspec ruby'],
    popularity: 78
  },
  {
    id: 'chai',
    name: 'Chai',
    category: 'testing-framework',
    synonyms: ['chai.js', 'chaijs', 'chai assertion'],
    popularity: 81
  },
  {
    id: 'vitest',
    name: 'Vitest',
    category: 'testing-framework',
    synonyms: ['vitest testing', 'vite test'],
    popularity: 85
  },
  {
    id: 'ava',
    name: 'AVA',
    category: 'testing-framework',
    synonyms: ['ava.js', 'avajs', 'ava testing'],
    popularity: 74
  },
  {
    id: 'tape',
    name: 'Tape',
    category: 'testing-framework',
    synonyms: ['tape.js', 'tapejs', 'tape testing'],
    popularity: 71
  },
  {
    id: 'enzyme',
    name: 'Enzyme',
    category: 'testing-framework',
    synonyms: ['enzyme.js', 'enzymejs', 'enzyme react'],
    popularity: 76
  },
  {
    id: 'react-testing-library',
    name: 'React Testing Library',
    category: 'testing-framework',
    synonyms: ['rtl', 'testing library', 'react-testing-lib'],
    popularity: 89
  },
  {
    id: 'vue-test-utils',
    name: 'Vue Test Utils',
    category: 'testing-framework',
    synonyms: ['vue testing library', '@vue/test-utils'],
    popularity: 82
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    category: 'testing-framework',
    synonyms: ['cucumber bdd', 'cucumber testing'],
    popularity: 77
  },
  {
    id: 'specflow',
    name: 'SpecFlow',
    category: 'testing-framework',
    synonyms: ['spec flow', 'specflow bdd'],
    popularity: 73
  },
  {
    id: 'postman',
    name: 'Postman',
    category: 'testing-framework',
    synonyms: ['postman api', 'postman testing'],
    popularity: 87
  },
  {
    id: 'insomnia',
    name: 'Insomnia',
    category: 'testing-framework',
    synonyms: ['insomnia api', 'insomnia rest'],
    popularity: 79
  },
  {
    id: 'k6',
    name: 'k6',
    category: 'testing-framework',
    synonyms: ['k6 load testing', 'grafana k6'],
    popularity: 78
  },
  {
    id: 'jmeter',
    name: 'JMeter',
    category: 'testing-framework',
    synonyms: ['apache jmeter', 'jmeter load testing'],
    popularity: 80
  },
  {
    id: 'gatling',
    name: 'Gatling',
    category: 'testing-framework',
    synonyms: ['gatling load testing', 'gatling performance'],
    popularity: 76
  },
  {
    id: 'locust',
    name: 'Locust',
    category: 'testing-framework',
    synonyms: ['locust.io', 'locust load testing'],
    popularity: 75
  },
  {
    id: 'supertest',
    name: 'SuperTest',
    category: 'testing-framework',
    synonyms: ['super-test', 'supertest.js'],
    popularity: 80
  },
  {
    id: 'nock',
    name: 'Nock',
    category: 'testing-framework',
    synonyms: ['nock.js', 'nock http'],
    popularity: 74
  },
  {
    id: 'mockito',
    name: 'Mockito',
    category: 'testing-framework',
    synonyms: ['mockito java', 'mockito framework'],
    popularity: 82
  },

  // Methodologies (20)
  {
    id: 'agile',
    name: 'Agile',
    category: 'methodology',
    synonyms: ['agile methodology', 'agile development', 'agile practices'],
    popularity: 94
  },
  {
    id: 'scrum',
    name: 'Scrum',
    category: 'methodology',
    synonyms: ['scrum framework', 'scrum methodology', 'scrum master'],
    popularity: 92
  },
  {
    id: 'kanban',
    name: 'Kanban',
    category: 'methodology',
    synonyms: ['kanban board', 'kanban methodology'],
    popularity: 88
  },
  {
    id: 'ci/cd',
    name: 'CI/CD',
    category: 'methodology',
    synonyms: ['continuous integration', 'continuous deployment', 'continuous delivery', 'cicd'],
    popularity: 95
  },
  {
    id: 'tdd',
    name: 'TDD',
    category: 'methodology',
    synonyms: ['test driven development', 'test-driven development'],
    popularity: 84
  },
  {
    id: 'bdd',
    name: 'BDD',
    category: 'methodology',
    synonyms: ['behavior driven development', 'behaviour driven development'],
    popularity: 80
  },
  {
    id: 'ddd',
    name: 'DDD',
    category: 'methodology',
    synonyms: ['domain driven design', 'domain-driven design'],
    popularity: 78
  },
  {
    id: 'microservices',
    name: 'Microservices',
    category: 'methodology',
    synonyms: ['microservice architecture', 'micro services', 'microservices pattern'],
    popularity: 90
  },
  {
    id: 'graphql',
    name: 'GraphQL',
    category: 'methodology',
    synonyms: ['graph ql', 'graphql api'],
    popularity: 87
  },
  {
    id: 'rest',
    name: 'REST',
    category: 'methodology',
    synonyms: ['rest api', 'restful', 'restful api', 'rest architecture'],
    popularity: 93
  },
  {
    id: 'grpc',
    name: 'gRPC',
    category: 'methodology',
    synonyms: ['grpc api', 'grpc framework'],
    popularity: 82
  },
  {
    id: 'soap',
    name: 'SOAP',
    category: 'methodology',
    synonyms: ['soap api', 'soap protocol'],
    popularity: 72
  },
  {
    id: 'oauth',
    name: 'OAuth',
    category: 'methodology',
    synonyms: ['oauth2', 'oauth 2.0', 'oauth authentication'],
    popularity: 86
  },
  {
    id: 'jwt',
    name: 'JWT',
    category: 'methodology',
    synonyms: ['json web token', 'jwt token', 'jwt authentication'],
    popularity: 88
  },
  {
    id: 'solid',
    name: 'SOLID',
    category: 'methodology',
    synonyms: ['solid principles', 'solid design'],
    popularity: 81
  },
  {
    id: 'clean-architecture',
    name: 'Clean Architecture',
    category: 'methodology',
    synonyms: ['clean code architecture', 'clean arch'],
    popularity: 79
  },
  {
    id: 'mvc',
    name: 'MVC',
    category: 'methodology',
    synonyms: ['model view controller', 'mvc pattern'],
    popularity: 85
  },
  {
    id: 'mvvm',
    name: 'MVVM',
    category: 'methodology',
    synonyms: ['model view viewmodel', 'mvvm pattern'],
    popularity: 80
  },
  {
    id: 'event-driven',
    name: 'Event-Driven Architecture',
    category: 'methodology',
    synonyms: ['event driven', 'eda', 'event-driven design'],
    popularity: 83
  },
  {
    id: 'serverless',
    name: 'Serverless',
    category: 'methodology',
    synonyms: ['serverless architecture', 'serverless computing', 'faas'],
    popularity: 85
  },

  // Other Tools & Technologies (230)
  {
    id: 'webpack',
    name: 'Webpack',
    category: 'other',
    synonyms: ['webpack.js', 'webpack bundler'],
    popularity: 87
  },
  {
    id: 'vite',
    name: 'Vite',
    category: 'other',
    synonyms: ['vite.js', 'vitejs', 'vite build'],
    popularity: 89
  },
  {
    id: 'rollup',
    name: 'Rollup',
    category: 'other',
    synonyms: ['rollup.js', 'rollupjs'],
    popularity: 80
  },
  {
    id: 'parcel',
    name: 'Parcel',
    category: 'other',
    synonyms: ['parcel.js', 'parceljs', 'parcel bundler'],
    popularity: 76
  },
  {
    id: 'esbuild',
    name: 'esbuild',
    category: 'other',
    synonyms: ['es build', 'esbuild bundler'],
    popularity: 82
  },
  {
    id: 'babel',
    name: 'Babel',
    category: 'other',
    synonyms: ['babel.js', 'babeljs', 'babel transpiler'],
    popularity: 85
  },
  {
    id: 'swc',
    name: 'SWC',
    category: 'other',
    synonyms: ['speedy web compiler', 'swc compiler'],
    popularity: 81
  },
  {
    id: 'eslint',
    name: 'ESLint',
    category: 'other',
    synonyms: ['es lint', 'eslint linter'],
    popularity: 90
  },
  {
    id: 'prettier',
    name: 'Prettier',
    category: 'other',
    synonyms: ['prettier formatter', 'prettier code'],
    popularity: 88
  },
  {
    id: 'stylelint',
    name: 'Stylelint',
    category: 'other',
    synonyms: ['style lint', 'stylelint css'],
    popularity: 78
  },
  {
    id: 'tailwindcss',
    name: 'Tailwind CSS',
    category: 'other',
    synonyms: ['tailwind', 'tailwindcss', 'tailwind css framework'],
    popularity: 93
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap',
    category: 'other',
    synonyms: ['bootstrap css', 'bootstrap framework'],
    popularity: 86
  },
  {
    id: 'material-ui',
    name: 'Material-UI',
    category: 'other',
    synonyms: ['mui', 'material ui', 'materialui', '@mui'],
    popularity: 87
  },
  {
    id: 'chakra-ui',
    name: 'Chakra UI',
    category: 'other',
    synonyms: ['chakra', 'chakraui', '@chakra-ui'],
    popularity: 84
  },
  {
    id: 'ant-design',
    name: 'Ant Design',
    category: 'other',
    synonyms: ['antd', 'ant design react', 'ant-design'],
    popularity: 83
  },
  {
    id: 'shadcn-ui',
    name: 'shadcn/ui',
    category: 'other',
    synonyms: ['shadcn', 'shadcn ui', 'shadcnui'],
    popularity: 86
  },
  {
    id: 'sass',
    name: 'Sass',
    category: 'other',
    synonyms: ['scss', 'sass css', 'sass preprocessor'],
    popularity: 84
  },
  {
    id: 'less',
    name: 'Less',
    category: 'other',
    synonyms: ['less css', 'less preprocessor'],
    popularity: 75
  },
  {
    id: 'stylus',
    name: 'Stylus',
    category: 'other',
    synonyms: ['stylus css', 'stylus preprocessor'],
    popularity: 70
  },
  {
    id: 'postcss',
    name: 'PostCSS',
    category: 'other',
    synonyms: ['post css', 'postcss processor'],
    popularity: 81
  },
  {
    id: 'redux',
    name: 'Redux',
    category: 'other',
    synonyms: ['redux.js', 'reduxjs', 'redux state'],
    popularity: 88
  },
  {
    id: 'mobx',
    name: 'MobX',
    category: 'other',
    synonyms: ['mobx state', 'mobx.js'],
    popularity: 79
  },
  {
    id: 'zustand',
    name: 'Zustand',
    category: 'other',
    synonyms: ['zustand state', 'zustand store'],
    popularity: 83
  },
  {
    id: 'recoil',
    name: 'Recoil',
    category: 'other',
    synonyms: ['recoil.js', 'recoiljs', 'recoil state'],
    popularity: 78
  },
  {
    id: 'jotai',
    name: 'Jotai',
    category: 'other',
    synonyms: ['jotai state', 'jotai atoms'],
    popularity: 77
  },
  {
    id: 'valtio',
    name: 'Valtio',
    category: 'other',
    synonyms: ['valtio state', 'valtio proxy'],
    popularity: 76
  },
  {
    id: 'xstate',
    name: 'XState',
    category: 'other',
    synonyms: ['xstate machine', 'x state'],
    popularity: 75
  },
  {
    id: 'react-query',
    name: 'React Query',
    category: 'other',
    synonyms: ['tanstack query', 'react-query', 'reactquery'],
    popularity: 87
  },
  {
    id: 'swr',
    name: 'SWR',
    category: 'other',
    synonyms: ['swr react', 'stale-while-revalidate'],
    popularity: 82
  },
  {
    id: 'apollo',
    name: 'Apollo',
    category: 'other',
    synonyms: ['apollo client', 'apollo graphql', 'apollo server'],
    popularity: 84
  },
  {
    id: 'urql',
    name: 'urql',
    category: 'other',
    synonyms: ['urql graphql', 'urql client'],
    popularity: 76
  },
  {
    id: 'relay',
    name: 'Relay',
    category: 'other',
    synonyms: ['relay graphql', 'relay framework'],
    popularity: 74
  },
  {
    id: 'prisma',
    name: 'Prisma',
    category: 'other',
    synonyms: ['prisma orm', 'prisma.io'],
    popularity: 88
  },
  {
    id: 'typeorm',
    name: 'TypeORM',
    category: 'other',
    synonyms: ['type orm', 'typeorm.io'],
    popularity: 83
  },
  {
    id: 'sequelize',
    name: 'Sequelize',
    category: 'other',
    synonyms: ['sequelize orm', 'sequelize.js'],
    popularity: 81
  },
  {
    id: 'drizzle',
    name: 'Drizzle',
    category: 'other',
    synonyms: ['drizzle orm', 'drizzle-orm'],
    popularity: 80
  },
  {
    id: 'knex',
    name: 'Knex',
    category: 'other',
    synonyms: ['knex.js', 'knexjs', 'knex query'],
    popularity: 78
  },
  {
    id: 'mongoose',
    name: 'Mongoose',
    category: 'other',
    synonyms: ['mongoose.js', 'mongoosejs', 'mongoose odm'],
    popularity: 85
  },
  {
    id: 'sqlalchemy',
    name: 'SQLAlchemy',
    category: 'other',
    synonyms: ['sql alchemy', 'sqlalchemy orm'],
    popularity: 84
  },
  {
    id: 'hibernate',
    name: 'Hibernate',
    category: 'other',
    synonyms: ['hibernate orm', 'hibernate java'],
    popularity: 82
  },
  {
    id: 'entity-framework',
    name: 'Entity Framework',
    category: 'other',
    synonyms: ['ef core', 'entity framework core', 'ef'],
    popularity: 81
  },
  {
    id: 'dapper',
    name: 'Dapper',
    category: 'other',
    synonyms: ['dapper orm', 'dapper micro-orm'],
    popularity: 77
  },
  {
    id: 'numpy',
    name: 'NumPy',
    category: 'other',
    synonyms: ['numpy python', 'numpy array'],
    popularity: 90
  },
  {
    id: 'pandas',
    name: 'Pandas',
    category: 'other',
    synonyms: ['pandas python', 'pandas dataframe'],
    popularity: 91
  },
  {
    id: 'matplotlib',
    name: 'Matplotlib',
    category: 'other',
    synonyms: ['matplotlib python', 'matplotlib plot'],
    popularity: 85
  },
  {
    id: 'seaborn',
    name: 'Seaborn',
    category: 'other',
    synonyms: ['seaborn python', 'seaborn visualization'],
    popularity: 82
  },
  {
    id: 'plotly',
    name: 'Plotly',
    category: 'other',
    synonyms: ['plotly python', 'plotly.js', 'plotly visualization'],
    popularity: 83
  },
  {
    id: 'scikit-learn',
    name: 'Scikit-learn',
    category: 'other',
    synonyms: ['sklearn', 'scikit learn', 'sklearn python'],
    popularity: 89
  },
  {
    id: 'tensorflow',
    name: 'TensorFlow',
    category: 'other',
    synonyms: ['tensor flow', 'tensorflow ml', 'tf'],
    popularity: 91
  },
  {
    id: 'pytorch',
    name: 'PyTorch',
    category: 'other',
    synonyms: ['pytorch ml', 'torch'],
    popularity: 92
  },
  {
    id: 'keras',
    name: 'Keras',
    category: 'other',
    synonyms: ['keras ml', 'keras deep learning'],
    popularity: 86
  },
  {
    id: 'opencv',
    name: 'OpenCV',
    category: 'other',
    synonyms: ['open cv', 'opencv computer vision'],
    popularity: 84
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    category: 'other',
    synonyms: ['huggingface transformers', 'hf', 'hugging face'],
    popularity: 87
  },
  {
    id: 'langchain',
    name: 'LangChain',
    category: 'other',
    synonyms: ['lang chain', 'langchain llm'],
    popularity: 85
  },
  {
    id: 'llamaindex',
    name: 'LlamaIndex',
    category: 'other',
    synonyms: ['llama index', 'llamaindex gpt'],
    popularity: 81
  },
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'other',
    synonyms: ['openai api', 'openai gpt', 'open ai'],
    popularity: 88
  },
  {
    id: 'pinecone',
    name: 'Pinecone',
    category: 'other',
    synonyms: ['pinecone vector', 'pinecone db'],
    popularity: 79
  },
  {
    id: 'weaviate',
    name: 'Weaviate',
    category: 'other',
    synonyms: ['weaviate vector', 'weaviate db'],
    popularity: 76
  },
  {
    id: 'chromadb',
    name: 'ChromaDB',
    category: 'other',
    synonyms: ['chroma db', 'chroma vector'],
    popularity: 78
  },
  {
    id: 'apache-spark',
    name: 'Apache Spark',
    category: 'other',
    synonyms: ['spark', 'pyspark', 'apache spark'],
    popularity: 86
  },
  {
    id: 'apache-kafka',
    name: 'Apache Kafka',
    category: 'other',
    synonyms: ['kafka', 'kafka streaming'],
    popularity: 88
  },
  {
    id: 'rabbitmq',
    name: 'RabbitMQ',
    category: 'other',
    synonyms: ['rabbit mq', 'rabbitmq messaging'],
    popularity: 83
  },
  {
    id: 'apache-airflow',
    name: 'Apache Airflow',
    category: 'other',
    synonyms: ['airflow', 'airflow orchestration'],
    popularity: 84
  },
  {
    id: 'dbt',
    name: 'dbt',
    category: 'other',
    synonyms: ['data build tool', 'dbt analytics'],
    popularity: 82
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    category: 'other',
    synonyms: ['snowflake db', 'snowflake data warehouse'],
    popularity: 85
  },
  {
    id: 'databricks',
    name: 'Databricks',
    category: 'other',
    synonyms: ['databricks platform', 'databricks spark'],
    popularity: 83
  },
  {
    id: 'tableau',
    name: 'Tableau',
    category: 'other',
    synonyms: ['tableau visualization', 'tableau bi'],
    popularity: 81
  },
  {
    id: 'power-bi',
    name: 'Power BI',
    category: 'other',
    synonyms: ['powerbi', 'microsoft power bi', 'power bi'],
    popularity: 84
  },
  {
    id: 'looker',
    name: 'Looker',
    category: 'other',
    synonyms: ['looker bi', 'google looker'],
    popularity: 78
  },
  {
    id: 'metabase',
    name: 'Metabase',
    category: 'other',
    synonyms: ['metabase bi', 'metabase analytics'],
    popularity: 75
  },
  {
    id: 'superset',
    name: 'Superset',
    category: 'other',
    synonyms: ['apache superset', 'superset bi'],
    popularity: 77
  },
  {
    id: 'redash',
    name: 'Redash',
    category: 'other',
    synonyms: ['redash visualization', 'redash analytics'],
    popularity: 74
  },
  {
    id: 'd3',
    name: 'D3.js',
    category: 'other',
    synonyms: ['d3', 'd3js', 'd3 visualization'],
    popularity: 82
  },
  {
    id: 'chart.js',
    name: 'Chart.js',
    category: 'other',
    synonyms: ['chartjs', 'chart js'],
    popularity: 80
  },
  {
    id: 'recharts',
    name: 'Recharts',
    category: 'other',
    synonyms: ['recharts react', 'recharts.js'],
    popularity: 79
  },
  {
    id: 'visx',
    name: 'visx',
    category: 'other',
    synonyms: ['visx react', 'airbnb visx'],
    popularity: 75
  },
  {
    id: 'three.js',
    name: 'Three.js',
    category: 'other',
    synonyms: ['threejs', 'three js', '3d.js'],
    popularity: 84
  },
  {
    id: 'webgl',
    name: 'WebGL',
    category: 'other',
    synonyms: ['web gl', 'webgl graphics'],
    popularity: 78
  },
  {
    id: 'gsap',
    name: 'GSAP',
    category: 'other',
    synonyms: ['greensock', 'gsap animation'],
    popularity: 80
  },
  {
    id: 'framer-motion',
    name: 'Framer Motion',
    category: 'other',
    synonyms: ['framer', 'framer-motion', 'framermotion'],
    popularity: 85
  },
  {
    id: 'socket.io',
    name: 'Socket.IO',
    category: 'other',
    synonyms: ['socketio', 'socket io', 'socket.io websocket'],
    popularity: 83
  },
  {
    id: 'websocket',
    name: 'WebSocket',
    category: 'other',
    synonyms: ['web socket', 'ws protocol'],
    popularity: 84
  },
  {
    id: 'webrtc',
    name: 'WebRTC',
    category: 'other',
    synonyms: ['web rtc', 'webrtc real-time'],
    popularity: 79
  },
  {
    id: 'pwa',
    name: 'PWA',
    category: 'other',
    synonyms: ['progressive web app', 'progressive web application'],
    popularity: 81
  },
  {
    id: 'service-worker',
    name: 'Service Worker',
    category: 'other',
    synonyms: ['serviceworker', 'sw api'],
    popularity: 77
  },
  {
    id: 'wasm',
    name: 'WebAssembly',
    category: 'other',
    synonyms: ['wasm', 'web assembly'],
    popularity: 80
  },
  {
    id: 'oauth2',
    name: 'OAuth 2.0',
    category: 'other',
    synonyms: ['oauth2', 'oauth 2', 'oauth2.0'],
    popularity: 85
  },
  {
    id: 'saml',
    name: 'SAML',
    category: 'other',
    synonyms: ['saml2', 'saml authentication'],
    popularity: 74
  },
  {
    id: 'openid',
    name: 'OpenID',
    category: 'other',
    synonyms: ['openid connect', 'oidc'],
    popularity: 76
  },
  {
    id: 'auth0',
    name: 'Auth0',
    category: 'other',
    synonyms: ['auth0 authentication', 'auth zero'],
    popularity: 82
  },
  {
    id: 'firebase',
    name: 'Firebase',
    category: 'other',
    synonyms: ['firebase platform', 'google firebase'],
    popularity: 87
  },
  {
    id: 'amplify',
    name: 'AWS Amplify',
    category: 'other',
    synonyms: ['amplify', 'aws amplify'],
    popularity: 80
  },
  {
    id: 'clerk',
    name: 'Clerk',
    category: 'other',
    synonyms: ['clerk.dev', 'clerk authentication'],
    popularity: 78
  },
  {
    id: 'nextauth',
    name: 'NextAuth',
    category: 'other',
    synonyms: ['next-auth', 'nextauth.js', 'auth.js'],
    popularity: 83
  },
  {
    id: 'passport',
    name: 'Passport',
    category: 'other',
    synonyms: ['passport.js', 'passportjs', 'passport authentication'],
    popularity: 81
  },
  {
    id: 'jsonwebtoken',
    name: 'jsonwebtoken',
    category: 'other',
    synonyms: ['jsonwebtoken npm', 'jwt library'],
    popularity: 84
  },
  {
    id: 'bcrypt',
    name: 'bcrypt',
    category: 'other',
    synonyms: ['bcrypt.js', 'bcryptjs', 'bcrypt hash'],
    popularity: 82
  },
  {
    id: 'axios',
    name: 'Axios',
    category: 'other',
    synonyms: ['axios http', 'axios.js'],
    popularity: 89
  },
  {
    id: 'fetch',
    name: 'Fetch API',
    category: 'other',
    synonyms: ['fetch', 'fetch api', 'fetch request'],
    popularity: 88
  },
  {
    id: 'got',
    name: 'Got',
    category: 'other',
    synonyms: ['got http', 'got.js'],
    popularity: 75
  },
  {
    id: 'node-fetch',
    name: 'node-fetch',
    category: 'other',
    synonyms: ['nodefetch', 'node fetch'],
    popularity: 79
  },
  {
    id: 'undici',
    name: 'Undici',
    category: 'other',
    synonyms: ['undici http', 'undici client'],
    popularity: 76
  },
  {
    id: 'express-validator',
    name: 'express-validator',
    category: 'other',
    synonyms: ['expressvalidator', 'express validator'],
    popularity: 78
  },
  {
    id: 'joi',
    name: 'Joi',
    category: 'other',
    synonyms: ['joi validation', 'joi schema'],
    popularity: 81
  },
  {
    id: 'yup',
    name: 'Yup',
    category: 'other',
    synonyms: ['yup validation', 'yup schema'],
    popularity: 83
  },
  {
    id: 'zod',
    name: 'Zod',
    category: 'other',
    synonyms: ['zod validation', 'zod schema'],
    popularity: 86
  },
  {
    id: 'ajv',
    name: 'Ajv',
    category: 'other',
    synonyms: ['ajv validator', 'ajv json schema'],
    popularity: 79
  },
  {
    id: 'class-validator',
    name: 'class-validator',
    category: 'other',
    synonyms: ['classvalidator', 'class validator'],
    popularity: 77
  },
  {
    id: 'react-hook-form',
    name: 'React Hook Form',
    category: 'other',
    synonyms: ['rhf', 'react-hook-form', 'reacthookform'],
    popularity: 88
  },
  {
    id: 'formik',
    name: 'Formik',
    category: 'other',
    synonyms: ['formik react', 'formik forms'],
    popularity: 82
  },
  {
    id: 'final-form',
    name: 'Final Form',
    category: 'other',
    synonyms: ['react-final-form', 'final form'],
    popularity: 74
  },
  {
    id: 'lodash',
    name: 'Lodash',
    category: 'other',
    synonyms: ['lodash.js', 'lodashjs', 'lodash utility'],
    popularity: 87
  },
  {
    id: 'ramda',
    name: 'Ramda',
    category: 'other',
    synonyms: ['ramda.js', 'ramdajs', 'ramda fp'],
    popularity: 76
  },
  {
    id: 'underscore',
    name: 'Underscore',
    category: 'other',
    synonyms: ['underscore.js', 'underscorejs'],
    popularity: 73
  },
  {
    id: 'moment',
    name: 'Moment.js',
    category: 'other',
    synonyms: ['momentjs', 'moment js'],
    popularity: 78
  },
  {
    id: 'dayjs',
    name: 'Day.js',
    category: 'other',
    synonyms: ['dayjs', 'day js'],
    popularity: 82
  },
  {
    id: 'date-fns',
    name: 'date-fns',
    category: 'other',
    synonyms: ['datefns', 'date fns'],
    popularity: 84
  },
  {
    id: 'luxon',
    name: 'Luxon',
    category: 'other',
    synonyms: ['luxon.js', 'luxonjs'],
    popularity: 77
  },
  {
    id: 'immutable',
    name: 'Immutable.js',
    category: 'other',
    synonyms: ['immutablejs', 'immutable js'],
    popularity: 76
  },
  {
    id: 'immer',
    name: 'Immer',
    category: 'other',
    synonyms: ['immer.js', 'immerjs', 'immer immutable'],
    popularity: 81
  },
  {
    id: 'rxjs',
    name: 'RxJS',
    category: 'other',
    synonyms: ['reactive extensions', 'rxjs reactive'],
    popularity: 80
  },
  {
    id: 'node.js',
    name: 'Node.js',
    category: 'other',
    synonyms: ['nodejs', 'node js', 'node'],
    popularity: 95
  },
  {
    id: 'deno',
    name: 'Deno',
    category: 'other',
    synonyms: ['deno runtime', 'deno.land'],
    popularity: 79
  },
  {
    id: 'bun',
    name: 'Bun',
    category: 'other',
    synonyms: ['bun runtime', 'bun.sh'],
    popularity: 81
  },
  {
    id: 'npm',
    name: 'npm',
    category: 'other',
    synonyms: ['npm package manager', 'npmjs'],
    popularity: 92
  },
  {
    id: 'yarn',
    name: 'Yarn',
    category: 'other',
    synonyms: ['yarn package manager', 'yarnpkg'],
    popularity: 86
  },
  {
    id: 'pnpm',
    name: 'pnpm',
    category: 'other',
    synonyms: ['pnpm package manager', 'performant npm'],
    popularity: 83
  },
  {
    id: 'pip',
    name: 'pip',
    category: 'other',
    synonyms: ['pip package manager', 'pip python'],
    popularity: 89
  },
  {
    id: 'conda',
    name: 'Conda',
    category: 'other',
    synonyms: ['conda package manager', 'anaconda'],
    popularity: 82
  },
  {
    id: 'poetry',
    name: 'Poetry',
    category: 'other',
    synonyms: ['poetry python', 'poetry package manager'],
    popularity: 80
  },
  {
    id: 'virtualenv',
    name: 'virtualenv',
    category: 'other',
    synonyms: ['virtual env', 'python virtualenv'],
    popularity: 81
  },
  {
    id: 'pipenv',
    name: 'Pipenv',
    category: 'other',
    synonyms: ['pip env', 'pipenv python'],
    popularity: 77
  },
  {
    id: 'composer',
    name: 'Composer',
    category: 'other',
    synonyms: ['composer php', 'composer package manager'],
    popularity: 79
  },
  {
    id: 'rubygems',
    name: 'RubyGems',
    category: 'other',
    synonyms: ['ruby gems', 'gem package manager'],
    popularity: 74
  },
  {
    id: 'bundler',
    name: 'Bundler',
    category: 'other',
    synonyms: ['bundler ruby', 'bundler gem'],
    popularity: 75
  },
  {
    id: 'nuget',
    name: 'NuGet',
    category: 'other',
    synonyms: ['nuget package manager', 'nuget .net'],
    popularity: 78
  },
  {
    id: 'cargo',
    name: 'Cargo',
    category: 'other',
    synonyms: ['cargo rust', 'cargo package manager'],
    popularity: 79
  },
  {
    id: 'homebrew',
    name: 'Homebrew',
    category: 'other',
    synonyms: ['brew', 'homebrew mac'],
    popularity: 80
  },
  {
    id: 'chocolatey',
    name: 'Chocolatey',
    category: 'other',
    synonyms: ['choco', 'chocolatey windows'],
    popularity: 72
  },
  {
    id: 'apt',
    name: 'APT',
    category: 'other',
    synonyms: ['apt-get', 'apt package manager', 'debian apt'],
    popularity: 77
  },
  {
    id: 'yum',
    name: 'YUM',
    category: 'other',
    synonyms: ['yum package manager', 'yellowdog updater'],
    popularity: 73
  },
  {
    id: 'linux',
    name: 'Linux',
    category: 'other',
    synonyms: ['linux os', 'gnu/linux'],
    popularity: 88
  },
  {
    id: 'ubuntu',
    name: 'Ubuntu',
    category: 'other',
    synonyms: ['ubuntu linux', 'ubuntu os'],
    popularity: 84
  },
  {
    id: 'debian',
    name: 'Debian',
    category: 'other',
    synonyms: ['debian linux', 'debian os'],
    popularity: 79
  },
  {
    id: 'centos',
    name: 'CentOS',
    category: 'other',
    synonyms: ['centos linux', 'centos os'],
    popularity: 76
  },
  {
    id: 'rhel',
    name: 'RHEL',
    category: 'other',
    synonyms: ['red hat enterprise linux', 'rhel linux'],
    popularity: 77
  },
  {
    id: 'alpine',
    name: 'Alpine Linux',
    category: 'other',
    synonyms: ['alpine', 'alpine os'],
    popularity: 78
  },
  {
    id: 'arch',
    name: 'Arch Linux',
    category: 'other',
    synonyms: ['arch', 'arch os'],
    popularity: 74
  },
  {
    id: 'fedora',
    name: 'Fedora',
    category: 'other',
    synonyms: ['fedora linux', 'fedora os'],
    popularity: 75
  },
  {
    id: 'macos',
    name: 'macOS',
    category: 'other',
    synonyms: ['mac os', 'osx', 'os x'],
    popularity: 83
  },
  {
    id: 'windows',
    name: 'Windows',
    category: 'other',
    synonyms: ['windows os', 'microsoft windows'],
    popularity: 86
  },
  {
    id: 'wsl',
    name: 'WSL',
    category: 'other',
    synonyms: ['windows subsystem for linux', 'wsl2'],
    popularity: 80
  },
  {
    id: 'vim',
    name: 'Vim',
    category: 'other',
    synonyms: ['vim editor', 'vi'],
    popularity: 79
  },
  {
    id: 'neovim',
    name: 'Neovim',
    category: 'other',
    synonyms: ['nvim', 'neovim editor'],
    popularity: 78
  },
  {
    id: 'emacs',
    name: 'Emacs',
    category: 'other',
    synonyms: ['emacs editor', 'gnu emacs'],
    popularity: 72
  },
  {
    id: 'vscode',
    name: 'VS Code',
    category: 'other',
    synonyms: ['visual studio code', 'vscode', 'vs code'],
    popularity: 94
  },
  {
    id: 'intellij',
    name: 'IntelliJ IDEA',
    category: 'other',
    synonyms: ['intellij', 'idea ide'],
    popularity: 85
  },
  {
    id: 'pycharm',
    name: 'PyCharm',
    category: 'other',
    synonyms: ['pycharm ide', 'pycharm python'],
    popularity: 82
  },
  {
    id: 'webstorm',
    name: 'WebStorm',
    category: 'other',
    synonyms: ['webstorm ide', 'webstorm jetbrains'],
    popularity: 78
  },
  {
    id: 'sublime',
    name: 'Sublime Text',
    category: 'other',
    synonyms: ['sublime', 'sublime text editor'],
    popularity: 77
  },
  {
    id: 'atom',
    name: 'Atom',
    category: 'other',
    synonyms: ['atom editor', 'atom ide'],
    popularity: 70
  },
  {
    id: 'jupyter',
    name: 'Jupyter',
    category: 'other',
    synonyms: ['jupyter notebook', 'jupyter lab'],
    popularity: 86
  },
  {
    id: 'colab',
    name: 'Google Colab',
    category: 'other',
    synonyms: ['colab', 'google colaboratory', 'colaboratory'],
    popularity: 81
  },
  {
    id: 'databricks-notebooks',
    name: 'Databricks Notebooks',
    category: 'other',
    synonyms: ['databricks notebook', 'databricks notebooks'],
    popularity: 76
  },
  {
    id: 'postman-api',
    name: 'Postman',
    category: 'other',
    synonyms: ['postman tool', 'postman client'],
    popularity: 88
  },
  {
    id: 'swagger',
    name: 'Swagger',
    category: 'other',
    synonyms: ['swagger api', 'openapi', 'swagger ui'],
    popularity: 85
  },
  {
    id: 'openapi',
    name: 'OpenAPI',
    category: 'other',
    synonyms: ['openapi spec', 'openapi specification'],
    popularity: 84
  },
  {
    id: 'api-gateway',
    name: 'API Gateway',
    category: 'other',
    synonyms: ['apigateway', 'api gateway pattern'],
    popularity: 82
  },
  {
    id: 'kong',
    name: 'Kong',
    category: 'other',
    synonyms: ['kong gateway', 'kong api gateway'],
    popularity: 78
  },
  {
    id: 'apigee',
    name: 'Apigee',
    category: 'other',
    synonyms: ['apigee api', 'google apigee'],
    popularity: 74
  },
  {
    id: 'mulesoft',
    name: 'MuleSoft',
    category: 'other',
    synonyms: ['mule soft', 'mulesoft api'],
    popularity: 75
  },
  {
    id: 'tyk',
    name: 'Tyk',
    category: 'other',
    synonyms: ['tyk gateway', 'tyk api'],
    popularity: 72
  },
  {
    id: 'strapi',
    name: 'Strapi',
    category: 'other',
    synonyms: ['strapi cms', 'strapi headless'],
    popularity: 79
  },
  {
    id: 'contentful',
    name: 'Contentful',
    category: 'other',
    synonyms: ['contentful cms', 'contentful headless'],
    popularity: 78
  },
  {
    id: 'sanity',
    name: 'Sanity',
    category: 'other',
    synonyms: ['sanity.io', 'sanity cms'],
    popularity: 80
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    category: 'other',
    synonyms: ['wordpress cms', 'wp'],
    popularity: 82
  },
  {
    id: 'drupal',
    name: 'Drupal',
    category: 'other',
    synonyms: ['drupal cms', 'drupal platform'],
    popularity: 73
  },
  {
    id: 'joomla',
    name: 'Joomla',
    category: 'other',
    synonyms: ['joomla cms', 'joomla platform'],
    popularity: 68
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'other',
    synonyms: ['shopify platform', 'shopify ecommerce'],
    popularity: 81
  },
  {
    id: 'magento',
    name: 'Magento',
    category: 'other',
    synonyms: ['magento ecommerce', 'adobe magento'],
    popularity: 74
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'other',
    synonyms: ['woo commerce', 'woocommerce plugin'],
    popularity: 77
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'other',
    synonyms: ['stripe payments', 'stripe api'],
    popularity: 87
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'other',
    synonyms: ['paypal payments', 'paypal api'],
    popularity: 80
  },
  {
    id: 'square',
    name: 'Square',
    category: 'other',
    synonyms: ['square payments', 'square api'],
    popularity: 76
  },
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'other',
    synonyms: ['twilio api', 'twilio sms'],
    popularity: 81
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'other',
    synonyms: ['sendgrid email', 'sendgrid api'],
    popularity: 78
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    category: 'other',
    synonyms: ['mailchimp email', 'mailchimp api'],
    popularity: 76
  },
  {
    id: 'algolia',
    name: 'Algolia',
    category: 'other',
    synonyms: ['algolia search', 'algolia api'],
    popularity: 79
  },
  {
    id: 'meilisearch',
    name: 'Meilisearch',
    category: 'other',
    synonyms: ['meili search', 'meilisearch engine'],
    popularity: 75
  },
  {
    id: 'typesense',
    name: 'Typesense',
    category: 'other',
    synonyms: ['typesense search', 'typesense engine'],
    popularity: 74
  },
  {
    id: 'mapbox',
    name: 'Mapbox',
    category: 'other',
    synonyms: ['mapbox maps', 'mapbox api'],
    popularity: 77
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    category: 'other',
    synonyms: ['google maps api', 'gmaps', 'google maps platform'],
    popularity: 83
  },
  {
    id: 'leaflet',
    name: 'Leaflet',
    category: 'other',
    synonyms: ['leaflet.js', 'leafletjs', 'leaflet maps'],
    popularity: 76
  },
  {
    id: 'openlayers',
    name: 'OpenLayers',
    category: 'other',
    synonyms: ['open layers', 'openlayers maps'],
    popularity: 73
  },
  {
    id: 'data-structures',
    name: 'Data Structures',
    category: 'other',
    synonyms: ['data structure', 'ds', 'data structures algorithms'],
    popularity: 90
  },
  {
    id: 'algorithms',
    name: 'Algorithms',
    category: 'other',
    synonyms: ['algorithm', 'algo', 'algorithmic'],
    popularity: 91
  },
  {
    id: 'oop',
    name: 'OOP',
    category: 'other',
    synonyms: ['object oriented programming', 'object-oriented programming', 'oop principles'],
    popularity: 88
  },
  {
    id: 'functional-programming',
    name: 'Functional Programming',
    category: 'other',
    synonyms: ['fp', 'functional programming paradigm', 'functional paradigm'],
    popularity: 82
  },
  {
    id: 'design-patterns',
    name: 'Design Patterns',
    category: 'other',
    synonyms: ['design pattern', 'software design patterns', 'gof patterns'],
    popularity: 85
  },
  {
    id: 'system-design',
    name: 'System Design',
    category: 'other',
    synonyms: ['systems design', 'distributed systems', 'system architecture'],
    popularity: 89
  },
  {
    id: 'low-level-design',
    name: 'Low Level Design',
    category: 'other',
    synonyms: ['lld', 'low-level design', 'object oriented design'],
    popularity: 80
  },
  {
    id: 'high-level-design',
    name: 'High Level Design',
    category: 'other',
    synonyms: ['hld', 'high-level design', 'architecture design'],
    popularity: 81
  },
  {
    id: 'concurrency',
    name: 'Concurrency',
    category: 'other',
    synonyms: ['concurrent programming', 'concurrency patterns', 'multithreading'],
    popularity: 83
  },
  {
    id: 'multithreading',
    name: 'Multithreading',
    category: 'other',
    synonyms: ['multi-threading', 'threading', 'parallel programming'],
    popularity: 82
  },
  {
    id: 'networking',
    name: 'Networking',
    category: 'other',
    synonyms: ['computer networking', 'network protocols', 'tcp/ip'],
    popularity: 84
  },
  {
    id: 'security',
    name: 'Security',
    category: 'other',
    synonyms: ['cybersecurity', 'application security', 'infosec'],
    popularity: 87
  },
  {
    id: 'cryptography',
    name: 'Cryptography',
    category: 'other',
    synonyms: ['encryption', 'crypto', 'cryptographic'],
    popularity: 79
  },
  {
    id: 'blockchain',
    name: 'Blockchain',
    category: 'other',
    synonyms: ['blockchain technology', 'distributed ledger'],
    popularity: 76
  },
  {
    id: 'smart-contracts',
    name: 'Smart Contracts',
    category: 'other',
    synonyms: ['smart contract', 'ethereum contracts'],
    popularity: 73
  },
  {
    id: 'web3',
    name: 'Web3',
    category: 'other',
    synonyms: ['web3.js', 'web3js', 'web 3.0'],
    popularity: 77
  },
  {
    id: 'ethers',
    name: 'Ethers.js',
    category: 'other',
    synonyms: ['ethers', 'ethersjs', 'ethers.js'],
    popularity: 75
  },
  {
    id: 'hardhat',
    name: 'Hardhat',
    category: 'other',
    synonyms: ['hardhat ethereum', 'hardhat framework'],
    popularity: 74
  },
  {
    id: 'truffle',
    name: 'Truffle',
    category: 'other',
    synonyms: ['truffle suite', 'truffle framework'],
    popularity: 72
  },
  {
    id: 'machine-learning',
    name: 'Machine Learning',
    category: 'other',
    synonyms: ['ml', 'machine learning algorithms', 'ml algorithms'],
    popularity: 92
  },
  {
    id: 'deep-learning',
    name: 'Deep Learning',
    category: 'other',
    synonyms: ['dl', 'deep learning models', 'neural networks'],
    popularity: 90
  },
  {
    id: 'computer-vision',
    name: 'Computer Vision',
    category: 'other',
    synonyms: ['cv', 'computer vision algorithms', 'image processing'],
    popularity: 86
  },
  {
    id: 'nlp',
    name: 'NLP',
    category: 'other',
    synonyms: ['natural language processing', 'nlp algorithms', 'text processing'],
    popularity: 88
  },
  {
    id: 'reinforcement-learning',
    name: 'Reinforcement Learning',
    category: 'other',
    synonyms: ['rl', 'reinforcement learning algorithms', 'rl algorithms'],
    popularity: 80
  },
  {
    id: 'generative-ai',
    name: 'Generative AI',
    category: 'other',
    synonyms: ['genai', 'gen ai', 'generative artificial intelligence'],
    popularity: 89
  },
  {
    id: 'llm',
    name: 'LLM',
    category: 'other',
    synonyms: ['large language model', 'llms', 'large language models'],
    popularity: 87
  },
  {
    id: 'prompt-engineering',
    name: 'Prompt Engineering',
    category: 'other',
    synonyms: ['prompt engineer', 'prompt design', 'prompt crafting'],
    popularity: 83
  },
  {
    id: 'rag',
    name: 'RAG',
    category: 'other',
    synonyms: ['retrieval augmented generation', 'rag pattern', 'retrieval-augmented generation'],
    popularity: 82
  },
  {
    id: 'fine-tuning',
    name: 'Fine-tuning',
    category: 'other',
    synonyms: ['model fine-tuning', 'finetuning', 'model training'],
    popularity: 81
  },

  // Soft Skills & Leadership (30 skills)
  {
    id: 'communication',
    name: 'Communication',
    category: 'other',
    synonyms: ['written communication', 'verbal communication', 'interpersonal communication'],
    popularity: 95
  },
  {
    id: 'leadership',
    name: 'Leadership',
    category: 'other',
    synonyms: ['team leadership', 'leading teams', 'leadership skills'],
    popularity: 92
  },
  {
    id: 'problem-solving',
    name: 'Problem Solving',
    category: 'other',
    synonyms: ['problem-solving skills', 'analytical thinking', 'critical thinking'],
    popularity: 94
  },
  {
    id: 'collaboration',
    name: 'Collaboration',
    category: 'other',
    synonyms: ['teamwork', 'team collaboration', 'cross-functional collaboration'],
    popularity: 93
  },
  {
    id: 'project-management',
    name: 'Project Management',
    category: 'methodology',
    synonyms: ['managing projects', 'project planning', 'project coordination'],
    popularity: 90
  },
  {
    id: 'time-management',
    name: 'Time Management',
    category: 'other',
    synonyms: ['prioritization', 'task management', 'deadline management'],
    popularity: 88
  },
  {
    id: 'adaptability',
    name: 'Adaptability',
    category: 'other',
    synonyms: ['flexibility', 'adaptable', 'flexible'],
    popularity: 87
  },
  {
    id: 'attention-to-detail',
    name: 'Attention to Detail',
    category: 'other',
    synonyms: ['detail-oriented', 'meticulous', 'thorough'],
    popularity: 89
  },
  {
    id: 'mentoring',
    name: 'Mentoring',
    category: 'other',
    synonyms: ['coaching', 'mentorship', 'coaching team members'],
    popularity: 85
  },
  {
    id: 'stakeholder-management',
    name: 'Stakeholder Management',
    category: 'other',
    synonyms: ['managing stakeholders', 'client relations', 'stakeholder communication'],
    popularity: 84
  },
  {
    id: 'technical-writing',
    name: 'Technical Writing',
    category: 'other',
    synonyms: ['documentation', 'writing documentation', 'technical documentation'],
    popularity: 86
  },
  {
    id: 'code-review',
    name: 'Code Review',
    category: 'other',
    synonyms: ['reviewing code', 'peer review', 'code reviews'],
    popularity: 88
  },
  {
    id: 'debugging',
    name: 'Debugging',
    category: 'other',
    synonyms: ['troubleshooting', 'bug fixing', 'problem diagnosis'],
    popularity: 91
  },
  {
    id: 'performance-optimization',
    name: 'Performance Optimization',
    category: 'other',
    synonyms: ['optimization', 'performance tuning', 'speed optimization'],
    popularity: 87
  },
  {
    id: 'security-best-practices',
    name: 'Security Best Practices',
    category: 'other',
    synonyms: ['application security', 'secure coding', 'security awareness'],
    popularity: 90
  },

  // Modern Cloud & Infrastructure (15 skills)
  {
    id: 'terraform',
    name: 'Terraform',
    category: 'devops-tool',
    synonyms: ['terraform iac', 'infrastructure as code terraform'],
    popularity: 89
  },
  {
    id: 'cloudformation',
    name: 'CloudFormation',
    category: 'devops-tool',
    synonyms: ['aws cloudformation', 'cloud formation'],
    popularity: 82
  },
  {
    id: 'pulumi',
    name: 'Pulumi',
    category: 'devops-tool',
    synonyms: ['pulumi iac'],
    popularity: 75
  },
  {
    id: 'datadog',
    name: 'Datadog',
    category: 'devops-tool',
    synonyms: ['datadog monitoring', 'datadog apm'],
    popularity: 83
  },
  {
    id: 'new-relic',
    name: 'New Relic',
    category: 'devops-tool',
    synonyms: ['newrelic', 'new relic apm'],
    popularity: 80
  },
  {
    id: 'splunk',
    name: 'Splunk',
    category: 'devops-tool',
    synonyms: ['splunk monitoring', 'splunk logging'],
    popularity: 81
  },
  {
    id: 'lambda',
    name: 'AWS Lambda',
    category: 'cloud-platform',
    synonyms: ['lambda functions', 'serverless lambda', 'aws lambda functions'],
    popularity: 88
  },
  {
    id: 's3',
    name: 'AWS S3',
    category: 'cloud-platform',
    synonyms: ['s3 storage', 'amazon s3', 'simple storage service'],
    popularity: 90
  },
  {
    id: 'ec2',
    name: 'AWS EC2',
    category: 'cloud-platform',
    synonyms: ['ec2 instances', 'amazon ec2', 'elastic compute cloud'],
    popularity: 87
  },
  {
    id: 'rds',
    name: 'AWS RDS',
    category: 'cloud-platform',
    synonyms: ['rds database', 'amazon rds', 'relational database service'],
    popularity: 85
  },
  {
    id: 'azure-functions',
    name: 'Azure Functions',
    category: 'cloud-platform',
    synonyms: ['serverless azure', 'azure serverless'],
    popularity: 82
  },
  {
    id: 'gcp-cloud-functions',
    name: 'Google Cloud Functions',
    category: 'cloud-platform',
    synonyms: ['cloud functions', 'gcp functions'],
    popularity: 80
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    category: 'database',
    synonyms: ['snowflake data warehouse', 'snowflake db'],
    popularity: 86
  },
  {
    id: 'databricks',
    name: 'Databricks',
    category: 'other',
    synonyms: ['databricks platform', 'databricks spark'],
    popularity: 84
  },
  {
    id: 'airflow',
    name: 'Apache Airflow',
    category: 'other',
    synonyms: ['airflow', 'airflow orchestration', 'apache airflow dags'],
    popularity: 85
  },
  // Import comprehensive skills expansion (Healthcare, Finance, HR, Sales, Marketing, etc.)
  ...COMPREHENSIVE_SKILLS_EXPANSION
];
