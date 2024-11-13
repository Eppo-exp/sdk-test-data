package cloud.eppo.android.sdkrelay

import io.socket.client.IO
import io.socket.client.Socket
import java.net.URISyntaxException

class SocketHandler {

  private lateinit var _socket: Socket
  val socket
    get() = this._socket

  @Synchronized
  fun setSocket(host: String, port: String) {
    try {
      _socket = IO.socket("$host:$port")
    } catch (_: URISyntaxException) {}
  }

  @Synchronized
  fun establishConnection() {
    _socket.connect()
  }

  @Synchronized
  fun closeConnection() {
    _socket.disconnect()
    _socket.off()
  }
}
