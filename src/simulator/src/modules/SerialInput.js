import CircuitElement from '../circuitElement'
import Node, { findNode } from '../node'
import { simulationArea } from '../simulationArea'
import { correctWidth, lineTo, moveTo, fillText } from '../canvasApi'
import { colors } from '../themer/themer'
import Button from '#/simulator/src/modules/Button'
/**
 * @class
 * SerialInput
 * D flip flop has 5 input nodes:
 * clock, data input, preset, reset ,enable.
 * @extends CircuitElement
 * @param {number} x - x coord of element
 * @param {number} y - y coord of element
 * @param {Scope=} scope - the ciruit in which we want the Element
 * @param {string=} dir - direcion in which element has to drawn
 * @category sequential
 */
export default class SerialInput extends CircuitElement {
    constructor(x, y, scope = globalScope, dir = 'RIGHT', bitWidth = 1) {
        super(x, y, scope, dir, bitWidth)
        this.sIn = new Node(10, 0, 1, this, this.bitWidth, 'Sin')
        this.wasAllowed = false
        navigator.serial.requestPort().then((port)=>{
            port.open({ baudRate: 9600 }).then(()=>{
                this.wasAllowed = true
                this.reader = port.readable.getReader();
                this.readSerialData()
            }).catch((error) => {
                console.log("Error opening serial port:", error)
            })
        }).catch((error) => {
            console.log("Error requesting serial port:", error)
        });
    }

    /**
     * WIP always resolvable?
     */
    isResolvable() {
        return false
    }
    newBitWidth(bitWidth) {
        this.bitWidth = bitWidth
        this.sIn.bitWidth = bitWidth
    }

    /**
     * @memberof SerialInput
     * On the leading edge of the clock signal (LOW-to-HIGH) the first stage,
     * the “master” latches the input condition at D, while the output stage is deactivated.
     * On the trailing edge of the clock signal (HIGH-to-LOW) the second “slave” stage is
     * now activated, latching on to the output from the first master circuit.
     * Then the output stage appears to be triggered on the negative edge of the clock pulse.
     * This fuction sets the value for the node qOutput based on the previous state
     * and input of the clock. We flip the bits to find qInvOutput
     */
    resolve() {
        simulationArea.simulationQueue.add(this.sIn)
    }
    async readSerialData() {
        while (this.wasAllowed) {
            try {
                const { value, done } = await this.reader.read()
                if (done) {
                    break
                }

                // Process the serial data
                if (value) {
                    // Assuming value is a Uint8Array
                    let data = value[0] // Assuming 1 byte of data for each read (adjust as necessary)

                    // If the bitWidth is greater than 1, we need to mask the data to fit the bitWidth
                    this.sIn.value = data & ((1 << this.bitWidth) - 1)  // Mask to ensure we only have `bitWidth` bits
                    console.log("Received Serial Data:", this.sIn.value)
                }
            } catch (error) {
                console.error("Error reading from serial port:", error)
            }
        }
    }
    customSave() {
        var data = {
            nodes: {
                sIn: findNode(this.sIn),
            },
            constructorParamaters: [this.direction, this.bitWidth],
        }
        return data
    }

    static moduleVerilog() {
        return `
module SerialInput(q, sin, clk);
    parameter WIDTH = 1;
    output reg [WIDTH-1:0] q;
    input clk;
    input [WIDTH-1:0] sin;

    always @ (posedge clk) begin
        q <= sin;
    end
endmodule
    `
    }
}
    /**
     * @memberof Button
     * @type {number}
     * @category modules
     */
    Button.prototype.propagationDelay = 0
    Button.prototype.objectType = 'Button'
    Button.prototype.canShowInSubcircuit = true
SerialInput.prototype.tooltipText = 'Serial Input ToolTip: Reads data from serial port.'
SerialInput.prototype.helplink =
    'https://docs.circuitverse.org'

SerialInput.prototype.objectType = 'SerialInput'
