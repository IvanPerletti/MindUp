function loadJSON() {
  console.log("LOADING: SCIENZE");

  data = [
    {
      id: "w1",
      word: "Fotosintesi",
      definitions: [
        "Processo con cui le piante producono energia",
        "Uso della luce per creare zuccheri"
      ]
    },
    {
      id: "w2",
      word: "Evaporazione",
      definitions: [
        "Passaggio da liquido a vapore",
        "Cambiamento di stato dell'acqua"
      ]
    },
    {
      id: "w3",
      word: "Radice",
      definitions: [
        "Parte della pianta che assorbe acqua"
      ]
    }
  ];

  buildExercise();
}
