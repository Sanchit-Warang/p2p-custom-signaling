const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
}

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
const roomId = urlParams.get('room')

if(!roomId){
  window.location.href = 'lobby.html'
}

const constraints = {
  video: {
    width: { min: 640, ideal: 1920, max: 1920 },
    height: { min: 480, ideal: 1080, max: 1080 },
  },
  audio: true,
}

let localStream
let remoteStream
let peerConnection
const socket = io()

const init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia(constraints)
  document.getElementById('user-1').srcObject = localStream
  joinRoom()

  socket.on('MessageFromPeer', (para) => {
    handleMessage(para)
  })

  socket.on('PeerLeft', (para) => {
    document.getElementById('user-2').style.display = 'none' 
    document.getElementById('user-1').classList.remove('smallFrame')
    console.log(`${para} left the room`)
  })

}

const handleMessage = (message) => {
  console.log('Message from peer:', message)
  if (message.type === 'offer') {
    createAnswer(message.data)
  } else if (message.type === 'answer') {
    addAnswer(message.data)
  } else if (message.type === 'candidate') {
    if(peerConnection){
      peerConnection.addIceCandidate(message.data)
    }
  }
}

const createPeerConnection = async() => {
  peerConnection = new RTCPeerConnection(servers)

  remoteStream = new MediaStream()
  document.getElementById('user-2').srcObject = remoteStream
  document.getElementById('user-2').style.display = 'block'
  document.getElementById('user-1').classList.add('smallFrame')

  console.log(document.getElementById('user-2'))

  if(!localStream){
    localStream = await navigator.mediaDevices.getUserMedia(constraints)
    document.getElementById('user-1').srcObject = localStream
  }

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream)
  })

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      console.log('ontrack:', track)
      remoteStream.addTrack(track)
    })
  }

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('New ICE candidate:', event.candidate)
      socket.emit('MessagePeer', { roomId, data: event.candidate, type: 'candidate' })
    }
  }
}

const createOffer = async () => {
  
  await createPeerConnection()

  const offer = await peerConnection.createOffer()
  await peerConnection.setLocalDescription(offer)

  console.log('offer:', offer)
  socket.emit('MessagePeer', { roomId, data: offer , type: 'offer' })
}

const createAnswer = async (offer) => {
  await createPeerConnection()
  console.log('prob',offer)
  await peerConnection.setRemoteDescription(offer)
  const answer = await peerConnection.createAnswer()
  await peerConnection.setLocalDescription(answer)
  socket.emit('MessagePeer', { roomId, data: answer, type: 'answer' })
}

const addAnswer = async (answer) => {
  if(!peerConnection.currentRemoteDescription){
  await peerConnection.setRemoteDescription(answer)
  }
}

const joinRoom = () => {
  socket.emit('joinRoom', { roomId })
  createOffer()
}

let leaveChannel = () => {
  socket.emit('disconnect')
}

let toggleCamera = async () => {
  let videoTrack = localStream.getTracks().find(track => track.kind === 'video')

  if(videoTrack.enabled){
      videoTrack.enabled = false
      document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)'
  }else{
      videoTrack.enabled = true
      document.getElementById('camera-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
  }
}

let toggleMic = async () => {

  let audioTrack = localStream.getTracks().find(track => track.kind === 'audio')
  if(audioTrack.enabled){
      audioTrack.enabled = false
      document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)'
  }else{
      audioTrack.enabled = true
      document.getElementById('mic-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
  }
}

window.addEventListener('beforeunload', leaveChannel)

document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)

init()
console.log(remoteStream)