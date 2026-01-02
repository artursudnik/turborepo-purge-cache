import { parseArguments } from './commander';

describe('parseArguments', () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    jest.resetModules();
    process.argv = [...originalArgv];
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('should return default values when no arguments are provided', () => {
    process.argv = ['node', 'test'];

    const result = parseArguments();

    expect(result).toEqual({
      path: '.turbo',
      options: {
        runsTtl: 7,
        cacheTtl: 7,
      },
    });
  });

  it('should parse custom path argument', () => {
    process.argv = ['node', 'test', 'custom-path'];

    const result = parseArguments();

    expect(result.path).toBe('custom-path');
  });

  it('should parse custom --runs-ttl and --cache-ttl', () => {
    process.argv = [
      'node',
      'test',
      '--runs-ttl',
      '10',
      '--cache-ttl',
      '5',
      'custom-path',
    ];

    const result = parseArguments();

    expect(result).toEqual({
      path: 'custom-path',
      options: {
        runsTtl: 10,
        cacheTtl: 5,
      },
    });
  });

  it('should throw error for invalid --runs-ttl (not an integer)', () => {
    process.argv = ['node', 'test', '--runs-ttl', 'abc'];

    // Commander calls process.exit() or throws error depending on configuration
    // parseArguments uses program.error() which by default exits or throws
    // We expect it to fail validation.

    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    const mockStderrWrite = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation();

    expect(() => parseArguments()).toThrow();

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
    mockStderrWrite.mockRestore();
  });

  it('should throw error for invalid --runs-ttl (less than 1)', () => {
    process.argv = ['node', 'test', '--runs-ttl', '0'];

    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    const mockStderrWrite = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation();

    expect(() => parseArguments()).toThrow();

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
    mockStderrWrite.mockRestore();
  });

  it('should throw error for invalid --cache-ttl (less than 0)', () => {
    process.argv = ['node', 'test', '--cache-ttl', '-1'];

    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    const mockStderrWrite = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation();

    expect(() => parseArguments()).toThrow();

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
    mockStderrWrite.mockRestore();
  });
});
