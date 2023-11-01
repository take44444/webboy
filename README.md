# WEB BOY

インターネットを介して通信が可能なGAME BOYエミュレータを提供するWebアプリです．

## ブートROMについて

著作権遵守のため，このエミュレータはオリジナルのブートROMではなく，OSSのブートROMを使用します．

## 実装について

サーバーはNestJS，フロント（エミュレータ本体）はRustによるWASMで開発しています．

エミュレータのレポジトリは https://github.com/take44444/gb-emu です．フロントを切り離して実装しているため，WASM/デスクトップアプリで，コンパイルターゲットを容易に切り替えることが可能です．

通信にはWebSocketを使用しています．GAME BOYのシリアル通信をWebSocketに乗せるだけなので，実装は非常にシンプルです．