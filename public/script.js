import THREE from "https://dev.jspm.io/npm:three@0.117.1"
import { GLTFLoader } from "https://dev.jspm.io/npm:three@0.117.1/examples/jsm/loaders/GLTFLoader"
import { OrbitControls } from "https://dev.jspm.io/npm:three@0.117.1/examples/jsm/controls/OrbitControls"

const FOV = 60
const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight
const ASPECT_RATIO = WIDTH / HEIGHT

class Board {
  constructor (width, height) {
    this.width = width
    this.height = height
    this.board = {}
  }

  map (fn) {
    const output = []

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        output.push(fn(this.board[`${x}/${y}`], x, y))
      }
    }

    return output
  }

  place (x, y, piece) {
    this.board[`${x}/${y}`] = piece
  }
}

class Chess {
  constructor () {
    this.board = new Board(8, 8)
    this.discard = []
  }

  start () {
    for (let c = 0; c < 2; c++) {
      const colour = c === 0 ? "WHITE" : "BLACK"
      const rowModifier = colour === "WHITE" ? n => 7 - n : n => n

      for (let i = 0; i < 8; i++) {
        this.board.place(i, rowModifier(1), this.createPiece("PAWN", colour))
      }

      this.board.place(0, rowModifier(0), this.createPiece("ROOK", colour))
      this.board.place(7, rowModifier(0), this.createPiece("ROOK", colour))
      this.board.place(1, rowModifier(0), this.createPiece("HORSE", colour))
      this.board.place(6, rowModifier(0), this.createPiece("HORSE", colour))
      this.board.place(2, rowModifier(0), this.createPiece("BISHOP", colour))
      this.board.place(5, rowModifier(0), this.createPiece("BISHOP", colour))
      this.board.place(3, rowModifier(0), this.createPiece("QUEEN", colour))
      this.board.place(4, rowModifier(0), this.createPiece("KING", colour))
    }

    console.log(this.board)
  }

  map (fn) {
    return this.board.map(fn)
  }

  createPiece (type, colour) {
    const id = type + "_" + Math.random().toString().slice(2)
    return { id, type, colour }
  }
}

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(FOV, ASPECT_RATIO, 0.1, 1000)
// const camera = new THREE.OrthographicCamera(WIDTH / -2, WIDTH / 2, HEIGHT / 2, HEIGHT / -2, 0.1, 1000)
const raycaster = new THREE.Raycaster()
const renderer = new THREE.WebGLRenderer({ precision: "highp", antialias: true, alpha: true })
const mouse = new THREE.Vector2()
const controls = new OrbitControls(camera, renderer.domElement)
const loader = new GLTFLoader()

const chess = new Chess()

const chessPiecesGroup = new THREE.Group()
const chessBoardGroup = new THREE.Group()
const chessOverlayGroup = new THREE.Group()

const createChessBoard = () => {
  for (let x = 0; x < 24; x++) {
    for (let z = 0; z < 24; z++) {
      const color =
        x < 8 || x >= 16 || z < 8 || z >= 16 ? "rgba(255, 130, 130)" :
        (x + z) % 2 === 0 ? "yellow" : "blue"

      const geom = new THREE.BoxGeometry(1, 0.2, 1)
      const mat = new THREE.MeshPhongMaterial({ color })
      const cube = new THREE.Mesh(geom, mat)

      cube.castShadow = false
      cube.receiveShadow = true

      chessBoardGroup.add(cube)
      // cube.position.set(x - 3.5, 0, z - 3.5)
      cube.position.set(x - 3.5 - 8, 0, z - 3.5 - 8)
    }
  }

  for (let x = 0; x < 24; x++) {
    for (let z = 0; z < 24; z++) {
      const geom = new THREE.BoxGeometry(1, 0.2, 1)
      const mat = new THREE.MeshPhongMaterial({ color: "pink", opacity: 0.1, transparent: true })
      const cube = new THREE.Mesh(geom, mat)
      // cube.name =

      chessOverlayGroup.add(cube)
      // cube.position.set(x - 3.5, 0, z - 3.5)
      cube.position.set(x - 3.5 - 8, 0, z - 3.5 - 8)
    }
  }

  scene.add(chessBoardGroup)
  scene.add(chessOverlayGroup)
}

const loadChessGltfScene = () => {
  return new Promise((resolve, reject) => {
    loader.load("/scene.gltf", gltf => {
      resolve(gltf)
    }, undefined, err => reject(err))
  })
}

const placeChessPieces = async () => {
  const chessScene = await loadChessGltfScene()
  const pieces = chessScene.scene.children[0].children[0].children[0].children[0].children

  // pieces.forEach(p => chessPiecesGroup.add(p))
  console.log(pieces)

  chess.map((tile, x, z) => {
    if (!tile) return

    const modelName =
      tile.colour === "WHITE" && tile.type === "ROOK" ? "Rook_White_0" :
      tile.colour === "WHITE" && tile.type === "HORSE" ? "Knight_White_0" :
      tile.colour === "WHITE" && tile.type === "BISHOP" ? "Bishop_White_0" :
      tile.colour === "WHITE" && tile.type === "QUEEN" ? "Queen_White_0" :
      tile.colour === "WHITE" && tile.type === "KING" ? "King_White_0" :
      tile.colour === "WHITE" && tile.type === "PAWN" ? "Pawn001_White_0" :
      tile.colour === "BLACK" && tile.type === "ROOK" ? "Rook002_Black_0" :
      tile.colour === "BLACK" && tile.type === "HORSE" ? "Knight002_Black_0" :
      tile.colour === "BLACK" && tile.type === "BISHOP" ? "Bishop002_Black_0" :
      tile.colour === "BLACK" && tile.type === "QUEEN" ? "Queen001_Black_0" :
      tile.colour === "BLACK" && tile.type === "KING" ? "King001_Black_0" :
      tile.colour === "BLACK" && tile.type === "PAWN" ? "Pawn008_Black_0" :
      null

    const model = pieces.find(p => p.children[0].children[0]
      && p.children[0].children[0].name === modelName)

    const piece = model.clone()
    const color = tile.colour === "WHITE" ? "yellow" : "blue"
    const mat = new THREE.MeshPhongMaterial({ color })

    piece.children[0].children[0].material = mat
    piece.name = tile.id
    piece.scale.x = 0.009
    piece.scale.y = 0.009
    piece.scale.z = 0.009
    piece.castShadow = true
    piece.receiveShadow = true

    chessPiecesGroup.add(piece)
    piece.position.set(x - 3.5, 0.1, z - 3.5)

    const outlineMat = new THREE.MeshPhongMaterial({ color: 0x000000/*, side: THREE.BackSide*/ })
    const outline = piece.clone()
    outline.children[0].children[0].material = outlineMat
    outline.position.set(piece.position)
    outline.scale.x = 0.012
    outline.scale.y = 0.012
    outline.scale.z = 0.012
    scene.add(outline)
  })

  scene.add(chessPiecesGroup)
}

let selectedPiece = null
let clicked = false

const render = time => {
  requestAnimationFrame(render)

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(scene.children, true)
  // console.log(intersects)
  const overlay = intersects.find(intersect => {
    return chessOverlayGroup.children.some(c => c.uuid === intersect.object.uuid)
  })

  const hoveredPiece = overlay && chessPiecesGroup.children.find(c => c.position.x === overlay.object.position.x
    && c.position.z === overlay.object.position.z)

  // chessPiecesGroup.children.forEach(c => {
  //   c.position.y = 0
  // })

  chessBoardGroup.children.forEach(c => {
    c.position.y = 0
  })

  chessOverlayGroup.children.forEach(c => {
    c.material.opacity = 0
    c.position.y = 0
  })

  // if (hoveredPiece) hoveredPiece.position.y = 0.2

  if (overlay) {
    // const tile = chessBoardGroup.children.find(c => c.position.x === overlay.object.position.x
    //     && c.position.z === overlay.object.position.z)
    overlay.object.material.opacity = 0.5
    // overlay.object.position.y = 0
    // tile.position.y = 0.4

    // if (hoveredPiece) hoveredPiece.position.y = 0.6
  }

  if (overlay && clicked) {
    if (selectedPiece) {
      selectedPiece.position.x = overlay.object.position.x
      selectedPiece.position.z = overlay.object.position.z
      selectedPiece = hoveredPiece ? hoveredPiece : null
    } else {
      selectedPiece = chessPiecesGroup.children.find(c => c.position.x === overlay.object.position.x
        && c.position.z === overlay.object.position.z)
    }
  }

  if (selectedPiece) {
    // selectedPiece.position.y = 1

    if (overlay) {
      selectedPiece.position.x = overlay.point.x
      selectedPiece.position.z = overlay.point.z
    }
  }

  clicked = false
  renderer.render(scene, camera)
}

const mousemove = e => {
  mouse.x = ((event.clientX + window.scrollX - renderer.domElement.offsetLeft) / WIDTH) * 2 - 1
  mouse.y = -((event.clientY + window.scrollY - renderer.domElement.offsetTop) / HEIGHT) * 2 + 1
}

const click = e => {
  clicked = true
}

;(async () => {
  try {
    chess.start()

    createChessBoard()
    await placeChessPieces()

    // const panoGeom = new THREE.SphereBufferGeometry(500, 60, 40)
    // panoGeom.scale(-1, 1, 1)
    // const panoTex = new THREE.TextureLoader().load("29277159034_6279f549af_o.jpg")
    // const panoMat = new THREE.MeshPhongMaterial({ map: panoTex })
    // const pano = new THREE.Mesh(panoGeom, panoMat)
    // pano.rotation.y = -Math.PI / 2
    // scene.add(pano)

    renderer.setSize(WIDTH, HEIGHT)
    document.body.appendChild(renderer.domElement)

    camera.position.x = 0
    camera.position.y = 8
    camera.position.z = 8
    controls.update()

    // const light = new THREE.AmbientLight(0xffffff, 1)
    const light = new THREE.HemisphereLight(0xFFFFFF, 0x000000, 1)
    scene.add(light)

    console.log(scene.children)
    render(0)

    renderer.domElement.addEventListener("mousemove", mousemove)
    renderer.domElement.addEventListener("click", click)
  } catch (e) {
    console.error(e)
  }
})()