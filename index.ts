interface UserMock {
  name: string;
  age: number;
  roles: string[];
  createdAt: Date;
  isDeleted: boolean;
}

interface RequestMock {
  method: HTTP_METHOD;
  host: string;
  path: string;
  body?: UserMock;
  params: {
    id?: string;
  };
}

interface Handlers {
  next: (value: RequestMock) => void;
  error: (value: any) => void;
  complete: () => void;
}

enum HTTP_METHOD {
  POST = 'POST',
  GET = 'GET',
}

enum HTTP_STATUS {
  OK = 200,
  INTERNAL_SERVER_ERROR = 500,
}

class Observer {
  isUnsubscribed: boolean;
  _unsubscribe: Function | undefined;

  constructor(public handlers: Handlers) {
    this.isUnsubscribed = false;
  }

  next(value: RequestMock): void {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error: unknown): void {
    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        this.handlers.error(error);
      }

      this.unsubscribe();
    }
  }

  complete(): void {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }

      this.unsubscribe();
    }
  }

  unsubscribe(): void {
    this.isUnsubscribed = true;

    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}

class Observable {
  _subscribe: (observer: Observer) => Function;

  constructor(subscribe: (observer: Observer) => Function) {
    this._subscribe = subscribe;
  }

  static from(values: RequestMock[]): Observable {
    return new Observable((observer: Observer): Function => {
      values.forEach((value) => observer.next(value));

      observer.complete();

      return (): void => {
        console.log('unsubscribed');
      };
    });
  }

  subscribe(obs: Handlers): { unsubscribe: () => void } {
    const observer: Observer = new Observer(obs);

    observer._unsubscribe = this._subscribe(observer);

    return {
      unsubscribe() {
        observer.unsubscribe();
      },
    };
  }
}

const userMock: UserMock = {
  name: 'User Name',
  age: 26,
  roles: ['user', 'admin'],
  createdAt: new Date(),
  isDeleted: false,
};

const requestsMock: RequestMock[] = [
  {
    method: HTTP_METHOD.POST,
    host: 'service.example',
    path: 'user',
    body: userMock,
    params: {},
  },
  {
    method: HTTP_METHOD.GET,
    host: 'service.example',
    path: 'user',
    params: {
      id: '3f5h67s4s',
    },
  },
];

const handleRequest = (request: RequestMock): { status: HTTP_STATUS } => {
  return { status: HTTP_STATUS.OK };
};
const handleError = (error: RequestMock): { status: HTTP_STATUS } => {
  return { status: HTTP_STATUS.INTERNAL_SERVER_ERROR };
};
const handleComplete = (): void => console.log('complete');

const Handlers: Handlers = {
  next: handleRequest,
  error: handleError,
  complete: handleComplete,
};

const requests$: Observable = Observable.from(requestsMock);

const subscription = requests$.subscribe(Handlers);

subscription.unsubscribe();
