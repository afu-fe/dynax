import {
  blue,
  cyan,
  green,
  red,
  reset,
  yellow,
} from 'kolorist'


/**
 *  framworks 框架数据
 * 
 * @returns [{}]
 */
const frameworks = [
  {
    name: 'vue',
    display: 'Vue',
    color: green,
    variants: [
      {
        name: 'vue-ts',
        display: 'TypeScript',
        color: blue,
      },
      {
        name: 'vue',
        display: 'JavaScript',
        color: yellow,
      },
      {
        name: 'custom-create-vue',
        display: 'Customize with create-vue ↗',
        color: green,
        customCommand: 'npm create vue@latest TARGET_DIR',
      }
    ],
  },
  {
    name: 'react',
    display: 'React',
    color: cyan,
    variants: [
      {
        name: 'react',
        display: 'JavaScript',
        color: yellow,
      },
      {
        name: 'react-ts',
        display: 'TypeScript',
        color: blue,
      },
      {
        name: 'react-swc',
        display: 'JavaScript + SWC',
        color: yellow,
      },
      {
        name: 'react-swc-ts',
        display: 'TypeScript + SWC',
        color: blue,
      }
    ],
  },
  {
    name: 'react native',
    display: 'React Native',
    color: red,
    variants: [
      {
        name: 'react-native-ts',
        display: 'TypeScript',
        color: reset,
      },
    ]
  }
]
export default frameworks