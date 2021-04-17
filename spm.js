// spm.js by CoccaGuo on 2021.4.17
const fs = require("fs")
const assert = require("assert")

class SPM {
    constructor(filename) {
        this.filename = filename
        this.dataOffset = 0
        this.size = new Array()
        this.header = new Array()
           
        assert(fs.existsSync(this.filename), "File not exist.")
        let data = fs.readFileSync(this.filename)
        let prePtr = data.indexOf("\x1a")
        assert(data[prePtr + 1] == "4", "File data format error.")
        this.dataOffset = prePtr + 2
        let headString = data.slice(0, prePtr - 1).toString()

        // deal with file header
        let l = headString.split("\n")
        let key = undefined
        for (let i in l) {
            let line = l[i].trim()
            if (line[0] == ":") {
                key = line.split(":")[1]
                this.header[key] = []
            } else {
                if (line.length != 0) {
                    line = line.replace(/\t/g, " ")
                    let items = line.split(" ")
                    items = items.filter((i) => i != "")
                    this.header[key].push(items)
                }
            }
        }
        assert(['FLOAT', 'INT', 'UINT', 'DOUBLE'].indexOf(this.header['SCANIT_TYPE'][0][0]) != -1, "Data error.")
        this.size["pixels"] = {
            "x": parseInt(this.header['SCAN_PIXELS'][0][0]),
            "y": parseInt(this.header['SCAN_PIXELS'][0][1])
        }
        this.size["real"] = {
            "x": parseFloat(this.header['SCAN_RANGE'][0][0]),
            "y": parseFloat(this.header['SCAN_RANGE'][0][1]),
            "unit": "m"
        }
    }

    printChannels() {
        console.log("Channels")
        console.log("========")
        let h = this.header['DATA_INFO'][0]
        let i = h.indexOf('Name')
        this.header['DATA_INFO'].slice(1).forEach(element => {
            console.log(" - " + element[i])
        })
    }

    getChannel(name, direction="forward", corr=undefined) {
        let chID = 0
        for (let i in this.header['DATA_INFO'].slice(1)) {
            let ele = this.header['DATA_INFO'][i]
            if (ele[1] == name) {
                if (ele[3] == "both" && direction == "backward") chID++
                if (ele[3] == "both" || direction == ele[3]) break
                return undefined
            } else {
                if (ele[3] == "both") chID += 2
                else chID++
            }
        }
        let s = this.size['pixels']['x']*this.size['pixels']['y']
        let dataPtr = this.dataOffset + 4*chID*s
        let data = fs.readFileSync(this.filename).slice(dataPtr, dataPtr+4*s)
        let flag = false
        let resList = []
        if ('MSBFIRST'==this.header['SCANIT_TYPE'][0][1]) {
            flag = true
        }
        for (let i = 0; i < 4*s; i += 4){
            if (flag) {
                resList.push(data.slice(i, i+4).readFloatBE())
            } else {
                resList.push(data.slice(i, i+4).readFloatLE())
            }
        }
        return resList
    }
}

function print(a) {
    console.log(a)
}
let a = new SPM("C:/Users/Cocca-PC/Desktop/val/Au(111)H2O-20181130-171.sxm")
fs.writeFileSync("pic.txt", a.getChannel("Z").toString())