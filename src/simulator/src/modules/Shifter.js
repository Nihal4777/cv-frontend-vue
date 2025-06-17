/* eslint-disable no-bitwise */
import CircuitElement from '../circuitElement'
import Node, { findNode } from '../node'
import { simulationArea } from '../simulationArea'
import { correctWidth, lineTo, moveTo, fillText4 } from '../canvasApi'
import { colors } from '../themer/themer'

export default class Shifter extends CircuitElement {

    constructor(x, y, scope = globalScope, dir = 'DOWN', bitWidth = 1, noOfStages = 4) {
        super(x, y, scope, dir, bitWidth = 1)

        this.message = 'Shifter'

        this.width = 60;

        this.noOfStages = noOfStages || parseInt(prompt('Enter number of stages:'))

        const baseHeight = 230;
        const extraHeight = this.noOfStages * 20;
        this.height = baseHeight + extraHeight;

        // Set half-width, half-height for bounding box
        this.setDimensions(this.width / 2, baseHeight / 2)

        this.rectangleObject = false

        this.inp = []
        this.out = []

        this.reset = new Node(30, -90, 0, this, 1, 'Reset')
        this.shiftLoad = new Node(30, -70, 0, this, 1, 'Shift/Load')
        this.clk = new Node(30, -50, 0, this, 1, "Clock");

        for (let i = 0; i < this.noOfStages; i++) {
            const a = new Node(30, 20 * (i + 1), 0, this, this.bitWidth)
            this.inp.push(a)

            const b = new Node(-30, 20 * (i + 1), 1, this, this.bitWidth)
            b.value = 1;
            this.out.push(b)
        }

        this.lastClk = 0
        this.cell = new Array(this.noOfStages)
    }

    customDraw() {
        const ctx = simulationArea.context
        const xx = this.x
        const yy = this.y

        const width = this.width
        const baseHeight = 230; // fixed top height
        const extraHeight = this.noOfStages * 20; // dynamic growth below

        const partitionY = -30

        // Draw main rectangle
        ctx.beginPath();

        // top-left
        moveTo(ctx, -width / 2, -baseHeight / 2, xx, yy, this.direction);

        // top-right
        lineTo(ctx, width / 2, -baseHeight / 2, xx, yy, this.direction);

        // bottom-right (extends with noOfStages)
        lineTo(ctx, width / 2, extraHeight + 20, xx, yy, this.direction);

        // bottom-left
        lineTo(ctx, -width / 2, extraHeight + 20, xx, yy, this.direction);

        ctx.closePath();
        ctx.strokeStyle = colors['stroke']
        ctx.fillStyle = colors['fill']
        ctx.lineWidth = correctWidth(3)
        ctx.stroke();
        ctx.fill();

        // Partition line
        ctx.beginPath()
        moveTo(ctx, -width / 2, partitionY, xx, yy, this.direction)
        lineTo(ctx, width / 2, partitionY, xx, yy, this.direction)
        ctx.strokeStyle = '#555'
        ctx.setLineDash([4, 2])
        ctx.stroke()
        ctx.setLineDash([])

        // Section labels
        ctx.fillStyle = 'black'
        ctx.textAlign = 'center'
        fillText4(ctx, '>>>', 0, 0, xx, yy, this.direction, 10)

        // ==== Label control inputs (inside component) ====
        fillText4(ctx, 'Reset', 16, -90, xx, yy, this.direction, 6)
        fillText4(ctx, 'S/L', 16, -70, xx, yy, this.direction, 6)
        fillText4(ctx, 'Clock', 16, -50, xx, yy, this.direction, 6)

        // ==== Label data i/o ====
        for (let i = 0; i < this.noOfStages; i++) {
            fillText4(ctx, `In${i}`, 20, 20 * (i + 1), xx, yy, this.direction, 6)
            fillText4(ctx, `Out${i}`, -20, 20 * (i + 1), xx, yy, this.direction, 6)


            fillText4(ctx, this.cell[i] == undefined ? 'x' : this.cell[i], 0, 20 * (i + 1), xx, yy, this.direction, 8)
        }
        // Display register contents
        const state = this.cell.join('')

    }

    isResolvable() {
        return true;
    }

    resolve() {
        console.log("Hello")
        const clkValue = this.clk.value;
        // Rising edge detection
        if (this.lastClk === 0 && clkValue === 1) {
            if (this.reset.value === 1) {
                this.cell.fill(0);
            }
            else if (this.shiftLoad.value === 1) {
                for (let i = 0; i < this.noOfStages; i++) {
                    this.cell[i] = this.inp[i].value;
                }
            }
            else {
                this.cell.unshift(this.inp[0].value)
                this.cell.length = this.noOfStages
            }

            for (let i = 0; i < this.noOfStages; i++) {
                this.out[i].value = this.cell[i];
                simulationArea.simulationQueue.add(this.out[i])
            }
        }
        this.lastClk = clkValue
    }

    newBitWidth(bitWidth) {
         for (let i = 0; i < this.noOfStages; i++) {
            this.inp[i].bitWidth = bitWidth;
            this.out[i].bitWidth = bitWidth;
        }
    }

    customSave() {
        const data = {
            nodes: {
                reset: findNode(this.reset),
                shiftLoad: findNode(this.shiftLoad),
                clk: findNode(this.clk),
                out: this.out.map(findNode),
            },
            values: {
                cell: this.cell,
            },
            constructorParamaters: [this.direction, this.bitWidth, this.noOfStages],
        }
        return data
    }

    changeNumberofStages(noOfStages) {
        if (noOfStages == undefined || noOfStages < 1 || noOfStages > 32) return;
        if (this.noOfStages == noOfStages) return;
        var obj = new Shifter(this.x, this.y, this.scope, this.dir, this.bitWidth, noOfStages)
        this.delete()
        simulationArea.lastSelected = obj
        return obj
    }

}

Shifter.prototype.mutableProperties = {
    noOfStages: {
        name: 'Number of Stages: ',
        type: 'number',
        max: '32',
        min: '1',
        func: 'changeNumberofStages',
    }
}

Shifter.prototype.helplink =
    'https://docs.circuitverse.org/#/chapter4/<to be updated>'

Shifter.prototype.tooltipText = "Shifter";

Shifter.prototype.objectType = 'Shifter'
