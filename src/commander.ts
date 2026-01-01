import { Command } from 'commander';
import { z } from 'zod';

const optionsSchema = z.object({
  runsTtl: z.number().min(1),
  cacheTtl: z.number().min(0),
});

type Options = z.infer<typeof optionsSchema>;

export const parseArguments = (): {
  path?: string;
  options: Options;
} => {
  const program = new Command();

  program
    .name('turbo-cache-purge')
    .description(
      'purge .turbo folder content based on TTL and task cached output references',
    )
    .showHelpAfterError(true)
    .option(
      '--runs-ttl <days>',
      'number of days to keep runs',
      (v) => {
        const { error, data: value } = z
          .string()
          .regex(/^\d+$/, { message: 'must be a integer' })
          .pipe(z.transform((v) => parseInt(v, 10)))
          .pipe(z.number().min(1))
          .safeParse(v);

        if (error) {
          program.error(
            'invalid depth runs-ttl: ' +
              JSON.stringify(z.flattenError(error).formErrors[0]),
          );
        } else {
          return value;
        }
      },
      7,
    )
    .option(
      '--cache-ttl <days>',
      'number of days to keep unreferenced cached tasks',
      (v) => {
        const { error, data: value } = z
          .string()
          .regex(/^\d+$/, { message: 'must be a integer' })
          .pipe(z.transform((v) => parseInt(v, 10)))
          .pipe(z.number().min(0))
          .safeParse(v);

        if (error) {
          program.error(
            'invalid depth runs-ttl: ' +
              JSON.stringify(z.flattenError(error).formErrors[0]),
          );
        } else {
          return value;
        }
      },
      7,
    )
    .argument('[path]', 'path to the turbo folder', '.turbo');

  const parsed = program.parse();

  const options = optionsSchema.parse(parsed.opts());

  const path = parsed.processedArgs[0];

  return {
    path,
    options,
  };
};
