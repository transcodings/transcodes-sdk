import 'dotenv/config';
import replace from '@rollup/plugin-replace';
import typescript from 'rollup-plugin-typescript2';
import del from 'rollup-plugin-delete';

/** 빌드 시점에 주입 — 브라우저 번들에 `process`가 남지 않도록 함 */
const CDN_BASE_FROM_ENV =
  process.env.TRANSCODES_CDN_BASE || 'https://cdn.transcodes.link';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'lib/index.cjs',
      format: 'cjs',
    },
    {
      file: 'lib/index.esm.js',
      format: 'esm',
    },
  ],
  plugins: [
    del({ targets: ['lib/*'] }),
    typescript({ useTsconfigDeclarationDir: true }),
    replace({
      preventAssignment: true,
      values: {
        'process.env.TRANSCODES_CDN_BASE': JSON.stringify(CDN_BASE_FROM_ENV),
      },
    }),
  ],
};
