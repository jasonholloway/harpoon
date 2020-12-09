import { Bool, Guard, match as m, Num, Str } from '../src/Guard'
import { tryMatch as test } from './helpers'

describe('match' , () => {

  test({
    pattern: 'plops',
    yes: [
      'plops',
    ],
    no: [
      'slops',
      '',
      /plops/,
      123,
      undefined,
      null,
      false,
      []
    ]
  })

  test({
    pattern: Str,
    yes: [
      'plops',
      ''
    ],
    no: [
      123,
      undefined,
      null,
      false,
      []
    ]
  })

  test({
    pattern: 123,
    yes: [
      123
    ],
    no: [
      234,
      '123',
      undefined
    ]
  })

  test({
    pattern: Num,
    yes: [
      123,
      234,
      0,
      -9999999,
      NaN
    ],
    no: [
      '123',
      undefined,
      []
    ]
  })

  test({
    pattern: true,
    yes: [
      true
    ],
    no: [
      false,
      0,
      '123',
      undefined
    ]
  })

  test({
    pattern: Bool,
    yes: [
      true,
      false
    ],
    no: [
      undefined,
      null,
      [],
      'hello',
      0
    ]
  })

  test({
    pattern: undefined,
    yes: [
      undefined
    ],
    no: [
      null,
      false,
      0,
      []
    ]
  })

  test({
    pattern: /hello+/,
    yes: [
      'hello',
      'hellooooooo',
      /hello+/
    ],
    no: [
      'hell no',
      /mooooo/,
      null,
      [],
      0,
      false
    ]
  })
  

  describe('tuples', () => {
    test({
      pattern: [] as const,
      yes: [
        [],
        [] as const
      ],
      no: [
        [123],
        [123] as const,
        null,
        'hello',
        0
      ]
    })

    test({
      pattern: [123] as const,
      yes: [
        [123]
      ]
    })

    test({
      pattern: [true, [true]] as const,
      yes: [
        [true, [true]],
        [true, [true]] as const
      ],
      no: [
        [],
        [true],
        [true, []],
        [true, [123]]
      ]
    })
  })

  describe('tuples', () => {
    test({
      pattern: [] as const,
      yes: [
        [],
        [] as const
      ],
      no: [
        [123],
        [123] as const,
        null,
        'hello',
        0
      ]
    })

    test({
      pattern: [123] as const,
      yes: [
        [123]
      ]
    })

    test({
      pattern: [true, [true]] as const,
      yes: [
        [true, [true]],
        [true, [true]] as const
      ],
      no: [
        [],
        [true],
        [true, []],
        [true, [123]]
      ]
    })
  })

})
