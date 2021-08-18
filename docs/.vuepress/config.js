module.exports = {

  title: "Roy's Blog",
  description: "A place to record his growth",
  author: 'Roy Kid',

  head: [
    ['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1,user-scalable=no' }]
  ],

  plugins: ['code-switcher',
    'flowchart',
    ''],

    markdown: {
      // markdown-it-anchor 的选项
      anchor: { permalink: false },
      // markdown-it-toc 的选项
      toc: { includeLevel: [1, 2] },
      extendMarkdown: md => {
        // 使用更多的 markdown-it 插件!
        md.use(require('markdown-it-katex'))
      }
    },

    theme: 'reco',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/', icon: 'reco-home' },
      { text: 'TimeLine', link: '/timeline/', icon: 'reco-date' }
    ],
    // 博客配置
    blogConfig: {


      category: {
        location: 2,     // 在导航栏菜单中所占的位置，默认2
        text: 'Category' // 默认文案 “分类”
      },

      tag: {
        location: 3,     // 在导航栏菜单中所占的位置，默认3
        text: 'Tag'      // 默认文案 “标签”
      },

      socialLinks: [     // 信息栏展示社交信息
        { icon: 'reco-github', link: 'https://github.com/recoluan' },
        { icon: 'reco-npm', link: 'https://www.npmjs.com/~reco_luan' }
      ],
      codeTheme: 'tomorrow',

    }
  }
}
