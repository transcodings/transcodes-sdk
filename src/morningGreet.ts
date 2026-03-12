const monarchCats = ['Garfield', 'Felix', 'Grumpy'];

export const morningGreet = (name: string) => {
  let greet = 'Good morning ';
  if (monarchCats.includes(name)) {
    greet = 'Good morning, your MAJESTY, ';
  }

  return greet + name;
};
