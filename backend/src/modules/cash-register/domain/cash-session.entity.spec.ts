import { CashSession } from './cash-session.entity';
import { SessionAlreadyClosedException } from './cash-register.errors';

describe('CashSession entity', () => {
  const createOpenSession = () =>
    new CashSession(
      'session-1',
      'tenant-1',
      'user-1',
      500,
      null,
      null,
      null,
      'open',
      new Date(),
      null,
      null,
      new Date(),
      new Date(),
    );

  const createClosedSession = () =>
    new CashSession(
      'session-2',
      'tenant-1',
      'user-1',
      500,
      750,
      740,
      -10,
      'closed',
      new Date(),
      new Date(),
      null,
      new Date(),
      new Date(),
    );

  it('should be open when status is open', () => {
    const session = createOpenSession();
    expect(session.isOpen()).toBe(true);
  });

  it('should not be open when status is closed', () => {
    const session = createClosedSession();
    expect(session.isOpen()).toBe(false);
  });

  it('should validate open session without throwing', () => {
    const session = createOpenSession();
    expect(() => session.validateOpen()).not.toThrow();
  });

  it('should throw SessionAlreadyClosedException when validating closed session', () => {
    const session = createClosedSession();
    expect(() => session.validateOpen()).toThrow(SessionAlreadyClosedException);
  });

  it('should compute closing values correctly on close', () => {
    const session = createOpenSession();
    const result = session.close(800, 250);
    expect(result.closingBalance).toBe(750);
    expect(result.actualBalance).toBe(800);
    expect(result.difference).toBe(50);
  });

  it('should compute negative difference when actual is less than expected', () => {
    const session = createOpenSession();
    const result = session.close(700, 250);
    expect(result.closingBalance).toBe(750);
    expect(result.difference).toBe(-50);
  });

  it('should compute zero difference when actual equals expected', () => {
    const session = createOpenSession();
    const result = session.close(750, 250);
    expect(result.difference).toBe(0);
  });

  it('should throw when trying to close an already closed session', () => {
    const session = createClosedSession();
    expect(() => session.close(800, 0)).toThrow(SessionAlreadyClosedException);
  });

  it('should handle zero opening balance', () => {
    const session = new CashSession(
      'session-3',
      'tenant-1',
      'user-1',
      0,
      null,
      null,
      null,
      'open',
      new Date(),
      null,
      null,
      new Date(),
      new Date(),
    );
    const result = session.close(100, 100);
    expect(result.closingBalance).toBe(100);
    expect(result.difference).toBe(0);
  });
});
