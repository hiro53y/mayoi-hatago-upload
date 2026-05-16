# スプライトアセット

`generated-spritesheet-source.png` はGPT image 2.0で生成した元画像です。
`spritesheet-transparent.png` はクロマキー背景を透過した中間画像です。
ゲーム本体は個別に切り出したPNGを `src/components/DungeonSprite.tsx` から参照します。

`generated-player-directions-source-v2.png` はGPT image 2.0で追加生成した操作キャラクター4方向スプライトです。
`player-down.png`、`player-right.png`、`player-up.png`、`player-left.png` をゲーム内の向きに応じて使います。

生成プロンプト要約:

> オリジナルの和風ファンタジーローグライク向け、4 x 4の手描き2Dスプライトシート。旅人、階段、薬草、食料、敵、武器、防具、罠など。既存作品の固有デザインはコピーせず、クラシックな日本製ダンジョンRPGの雰囲気だけを参考にする。背景は透過処理用の単色クロマキー。

追加生成プロンプト要約:

> 変更前の低頭身旅人キャラクターを参照し、左/右/上/下向き4方向手描き2Dスプライトを生成。既存作品の固有デザインはコピーせず、歩き姿勢、単色クロマキー背景、影や水平線なし。
