class LiquidSorter {
    constructor(tubes, capacity) {
        this.tubes = JSON.parse(JSON.stringify(tubes));
        this.capacity = capacity;
        this.numTubes = tubes.length;
        this.moves = [];
    }

  
    isSorted() {
        return false; 
    }
}


const tubes = [
    [2, 1, 10, 5, 6, 12], [4, 8, 2, 3, 7, 12],
    [10, 4, 7, 11], [4, 6, 1, 8], [7, 3, 2, 11],
    [], [], [], [], [], [], [], [], []
];
const capacity = 6;

const sorter = new LiquidSorter(tubes, capacity);
console.log("Sorter initialized with", sorter.numTubes, "tubes.");