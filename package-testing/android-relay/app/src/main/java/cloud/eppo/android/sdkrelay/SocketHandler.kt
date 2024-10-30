package cloud.eppo.android.sdkrelay

import io.socket.client.IO
import io.socket.client.Socket
import java.net.URISyntaxException

object SocketHandler {

  lateinit var mSocket: Socket

  @Synchronized
  fun setSocket(host: String, port: String) {
    try {
      mSocket = IO.socket("$host:$port")
    } catch (e: URISyntaxException) {}
  }

  @Synchronized
  fun getSocket(): Socket {
    return mSocket
  }

  @Synchronized
  fun establishConnection() {
    mSocket.connect()
  }

  @Synchronized
  fun closeConnection() {
    mSocket.disconnect()
  }
}
