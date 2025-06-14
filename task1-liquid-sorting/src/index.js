class LiquidSorter {
    constructor(tubes, capacity) {
        this.tubes = JSON.parse(JSON.stringify(tubes)); 
        this.capacity = capacity;
        this.numTubes = tubes.length;
        this.moves = [];
    }

    isSorted() {
        for (let i = 0; i < this.numTubes; i++) {
            const tube = this.tubes[i];
            if (tube.length > 0) {
                const color = tube[0];
                for (let j = 1; j < tube.length; j++) {
                    if (tube[j] !== color) return false;
                }
            }
        }
        return true;
    }

    getEmptySpace(tube) {
        return this.capacity - tube.length;
    }

    canPour(fromTube, toTube) {
        if (fromTube.length === 0 || this.getEmptySpace(toTube) === 0) return false;
        const fromColor = fromTube[fromTube.length - 1];
        const toColor = toTube.length > 0 ? toTube[toTube.length - 1] : null;
        return toColor === null || toColor === fromColor;
    }

    pour(fromIdx, toIdx) {
        const fromTube = this.tubes[fromIdx];
        const toTube = this.tubes[toIdx];
        const space = this.getEmptySpace(toTube);
        const pourAmount = Math.min(space, fromTube.length);

        const color = fromTube[fromTube.length - 1];
        let count = 0;
        for (let i = fromTube.length - 1; i >= 0 && fromTube[i] === color && count < pourAmount; i--) {
            count++;
        }

        const moved = fromTube.splice(fromTube.length - count, count);
        toTube.push(...moved);
        this.moves.push(`(${fromIdx}, ${toIdx})`);
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
console.log("Is sorted:", sorter.isSorted());