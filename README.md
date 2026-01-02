# @artursudnik/turborepo-purge-cache

[![npm version](https://img.shields.io/npm/v/@artursudnik/turborepo-purge-cache.svg)](https://www.npmjs.com/package/@artursudnik/turborepo-purge-cache)
[![license](https://img.shields.io/npm/l/@artursudnik/turborepo-purge-cache.svg)](https://github.com/artursudnik/turborepo-purge-cache/blob/main/LICENSE)

A CLI tool to purge `.turbo` folder content based on Time-To-Live (TTL) and task cached output references.

Turborepo's local cache can grow significantly over time. While Turborepo manages the cache, it doesn't always aggressively clean up old runs or unreferenced cache entries. This tool helps keep your `.turbo` folder lean.

## Features

- **Remove old runs**: Deletes JSON files in `.turbo/runs` older than a specified number of days.
- **Cleanup unreferenced cache**: Identifies and removes cache entries in `.turbo/cache` that are no longer referenced by any existing run files and are older than a specified TTL.

## Installation

You can run it directly using `npx`:

```bash
npx @artursudnik/turborepo-purge-cache [path] [options]
```

Or install it globally:

```bash
pnpm add -g @artursudnik/turborepo-purge-cache
```

## Usage

```bash
turbo-purge-cache [path] [options]
```

### Arguments

- `path`: Path to the `.turbo` folder. Defaults to `.turbo` in the current directory.

### Options

- `--runs-ttl <days>`: Number of days to keep run history files. (Default: `7`)
- `--cache-ttl <days>`: Number of days to keep unreferenced cached tasks. (Default: `7`)
- `-h, --help`: Display help for command.

### Example

To keep only the last 3 days of runs and immediately remove any unreferenced cache entries:

```bash
npx @artursudnik/turborepo-purge-cache --runs-ttl 3 --cache-ttl 0
```

## How it works

1. **Runs Cleanup**: It first scans the `.turbo/runs` directory and deletes any `.json` files older than `--runs-ttl`.
2. **Reference Collection**: It then reads all remaining run files to collect all referenced cache hashes.
3. **Cache Cleanup**: Finally, it scans the `.turbo` directory (where cache entries are stored as `<hash>.tar.zst` or similar, depending on turbo version, but usually it looks for directories/files that match the hash pattern) and removes those that:
   - Are NOT in the list of referenced hashes.
   - ARE older than `--cache-ttl`.

## License

ISC
