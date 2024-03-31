import { html } from "@codemirror/lang-html";
import { CompletionContext } from "@codemirror/autocomplete";
import { syntaxTree, LRLanguage } from "@codemirror/language";
import { SyntaxNode } from "@lezer/common";
import corePluginList from 'tailwindcss/lib/corePluginList'
import { corePlugins } from 'tailwindcss/lib/corePlugins'
import { parser } from './parser'

import dlv from 'dlv'
const NegateValue = require('tailwindcss/lib/util/negateValue');
const NameClass = require('tailwindcss/lib/util/nameClass');
const defaultConfig = require('tailwindcss/resolveConfig')(
  require('tailwindcss/defaultConfig')
);


const classConfig = {
  category: 'Layout',
  subcategory: 'Basic',
  property: 'Columns',
  variant: 'lg',
};

function normalizeProperties(input) {
  if (typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(normalizeProperties);
  return Object.keys(input).reduce((newObj, key) => {
    let val = input[key];
    let newVal = typeof val === 'object' ? normalizeProperties(val) : val;
    newObj[
      key.replace(/([a-z])([A-Z])/g, (m, p1, p2) => `${p1}-${p2.toLowerCase()}`)
    ] = newVal;
    return newObj;
  }, {});
}

const getPlugins = () => {
  return corePluginList.default;
};


function getUtilities(plugin, { includeNegativeValues = false } = {}) {
  if (!plugin) return {};
  const utilities = {};

  function addUtilities(utils) {
    utils = Array.isArray(utils) ? utils : [utils];
    for (let i = 0; i < utils.length; i++) {
      for (let prop in utils[i]) {
        for (let p in utils[i][prop]) {
          if (p.startsWith('@defaults')) {
            delete utils[i][prop][p];
          }
        }
        utilities[prop] = normalizeProperties(utils[i][prop]);
      }
    }
  }

  plugin({
    addBase: () => {},
    addDefaults: () => {},
    addComponents: () => {},
    corePlugins: () => true,
    prefix: (x) => x,
    addUtilities,
    config: (x) =>  '',
    theme: (key, defaultValue) => dlv(defaultConfig.theme, key, defaultValue),
    matchUtilities: (matches, { values, supportsNegativeValues } = {}) => {
      if (!values) return;

      let modifierValues = Object.entries(values);

      if (includeNegativeValues && supportsNegativeValues) {
        let negativeValues = [];
        for (let [key, value] of modifierValues) {
          let negatedValue = NegateValue.default(value);
          if (negatedValue) {
            negativeValues.push([`-${key}`, negatedValue]);
          }
        }
        modifierValues.push(...negativeValues);
      }

      let result = Object.entries(matches).flatMap(
        ([name, utilityFunction]) => {
          return modifierValues
            .map(([modifier, value]) => {
              let declarations = utilityFunction(value, {
                includeRules(rules) {
                  addUtilities(rules);
                },
              });

              if (!declarations) {
                return null;
              }

              return {
                [NameClass.default(name, modifier)
                  .replace('.', '')
                  .replaceAll(/\\/g, '')]: classConfig,
              };
            })
            .filter(Boolean);
        }
      );

      for (let obj of result) {
        for (let key in obj) {
          let deleteKey = false;
          for (let subkey in obj[key]) {
            if (subkey.startsWith('@defaults')) {
              delete obj[key][subkey];
              continue;
            }
            if (subkey.includes('&')) {
              result.push({
                [subkey.replace(/&/g, key)]: obj[key][subkey],
              });
              deleteKey = true;
            }
          }

          if (deleteKey) delete obj[key];
        }
      }

      addUtilities(result);
    },
  });

  const utilitiesKeys = Object.keys(utilities);
  if (utilitiesKeys.length && utilitiesKeys[0].startsWith('.')) {
    const output = {};
    for (item in utilities) {
      output[item.replace('.', '').replaceAll(/\\/g, '')] = classConfig;
    }

    return output;
  }

  return utilities;
}

const classNames = corePluginList.filter(x => x !== 'preflight').map(x => Object.keys(getUtilities(corePlugins[x]))).flat()

const match = (typed: string, candidate: string) => {
  let index = 0
  for (const char of typed) {
    index = candidate.indexOf(char, index);
    if (index === -1) return false
  }
  return true
}

const classNameLang = LRLanguage.define({parser})

export const completeClassName = classNameLang.data.of({autocomplete: async (editor: CompletionContext) => {

  const ast = syntaxTree(editor.state)
  const node = ast.resolveInner(editor.state.selection.main.head, -1)

  const matchNodeType = (node: SyntaxNode, type: string) => node.type.name === type
  const getNodeText = (node: SyntaxNode) => editor.state.sliceDoc(node.from, node.to)

  if (matchNodeType(node, 'ClassName')) {
    const typed = getNodeText(node)
    const filtered = classNames.filter(x => match(typed, x))
    const sorted = filtered.filter(x => x.startsWith(typed)).concat(filtered.filter(x => !x.startsWith(typed)))
    return {
      options: sorted.map(x => ({
        label: x,
        apply: x,
      })),
      from: node.from,
      filter: false,
    }
  }
}})

export const tailwind = () => {
  const base = html({
    nestedAttributes: [{
      name: 'class',
      parser: classNameLang.parser.configure({}),
    }]
  })
  base.extension = [base.extension, completeClassName]
  return base
}
