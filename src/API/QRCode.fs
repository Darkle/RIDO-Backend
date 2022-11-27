module API.Views.QRCode

open System
open QRCoder
open Giraffe
open Giraffe.ViewEngine

type Message = { Text: string }

let pageHTML (base64QRCodeData: string) =
    html
        []
        [ head
              []
              [ title [] [ str "RIDO Setup QRCode" ]
                style [] [ str "body{display:flex;flex-direction:column;padding:10px;}" ] ]
          body
              []
              [ h1 [] [ str "RIDO Setup QRCode:" ]
                img [ _src (sprintf "data:image/png;base64,%s" base64QRCodeData); _width "220px" ] ] ]

let qrGenerator = new QRCodeGenerator()

let qrCodeData =
    qrGenerator.CreateQrCode(Utils.apiServerAddress, QRCodeGenerator.ECCLevel.Q)

let qrCode = new BitmapByteQRCode(qrCodeData)
let qrCodeAsBitmapByteArr = qrCode.GetGraphic(20)

let generateSetupQRCode () =
    Convert.ToBase64String(qrCodeAsBitmapByteArr) |> pageHTML |> htmlView
