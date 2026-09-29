import { LocalAccountRepository } from '../storage/repository';
import { createAccountService } from './account';
// Access lazily: browsers can throw even while retrieving window.localStorage.
export const accountService = createAccountService(
  new LocalAccountRepository({
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  }),
);
