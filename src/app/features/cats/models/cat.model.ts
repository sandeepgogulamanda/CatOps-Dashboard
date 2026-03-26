export interface Cat {
  id: string;
  name: string;
  age: string;
  description: string;
}

export interface CatDraft {
  name: string;
  age: string;
  description: string;
}

export interface ApiCat {
  id: string;
  info: {
    name: string;
    age: string;
    description: string;
  };
}
