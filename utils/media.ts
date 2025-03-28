import Big from "big.js"
import { ImageManipulator, SaveFormat } from "expo-image-manipulator"
import * as ImagePicker from "expo-image-picker"
import { Alert, Image, Linking } from "react-native"
import { Nullable } from "../types/general"
import logger from "./logger"

const imageMimeTypes = [
  "image/cgm",
  "image/example",
  "image/fits",
  "image/g3fax",
  "image/gif",
  "image/ief",
  "image/jp2",
  "image/jpeg",
  "image/jpm",
  "image/jpx",
  "image/ktx",
  "image/naplps",
  "image/png",
  "image/prs.btif",
  "image/prs.pti",
  "image/pwg-raster",
  "image/svg+xml",
  "image/t38",
  "image/tiff",
  "image/tiff-fx",
  "image/vnd.adobe.photoshop",
  "image/vnd.airzip.accelerator.azv",
  "image/vnd.cns.inf2",
  "image/vnd.dece.graphic",
  "image/vnd.djvu",
  "image/vnd.dvb.subtitle",
  "image/vnd.dwg",
  "image/vnd.dxf",
  "image/vnd.fastbidsheet",
  "image/vnd.fpx",
  "image/vnd.fst",
  "image/vnd.fujixerox.edmics-mmr",
  "image/vnd.fujixerox.edmics-rlc",
  "image/vnd.globalgraphics.pgb",
  "image/vnd.microsoft.icon",
  "image/vnd.mix",
  "image/vnd.ms-modi",
  "image/vnd.net-fpx",
  "image/vnd.radiance",
  "image/vnd.sealed.png",
  "image/vnd.sealedmedia.softseal.gif",
  "image/vnd.sealedmedia.softseal.jpg",
  "image/vnd.svf",
  "image/vnd.tencent.tap",
  "image/vnd.valve.source.texture",
  "image/vnd.wap.wbmp",
  "image/vnd.xiff",
  "image/vnd.zbrush.pcx",
]

const audioMimeTypes = [
  "audio/1d-interleaved-parityfec",
  "audio/32kadpcm",
  "audio/3gpp",
  "audio/3gpp2",
  "audio/ac3",
  "audio/AMR",
  "audio/AMR-WB",
  "audio/amr-wb+",
  "audio/aptx",
  "audio/asc",
  "audio/ATRAC-ADVANCED-LOSSLESS",
  "audio/ATRAC-X",
  "audio/ATRAC3",
  "audio/basic",
  "audio/BV16",
  "audio/BV32",
  "audio/clearmode",
  "audio/CN",
  "audio/DAT12",
  "audio/dls",
  "audio/dsr-es201108",
  "audio/dsr-es202050",
  "audio/dsr-es202211",
  "audio/dsr-es202212",
  "audio/DV",
  "audio/DVI4",
  "audio/eac3",
  "audio/encaprtp",
  "audio/EVRC",
  "audio/EVRC-QCP",
  "audio/EVRC0",
  "audio/EVRC1",
  "audio/EVRCB",
  "audio/EVRCB0",
  "audio/EVRCB1",
  "audio/EVRCNW",
  "audio/EVRCNW0",
  "audio/EVRCNW1",
  "audio/EVRCWB",
  "audio/EVRCWB0",
  "audio/EVRCWB1",
  "audio/example",
  "audio/fwdred",
  "audio/G719",
  "audio/G722",
  "audio/G7221",
  "audio/G723",
  "audio/G726-16",
  "audio/G726-24",
  "audio/G726-32",
  "audio/G726-40",
  "audio/G728",
  "audio/G729",
  "audio/G7291",
  "audio/G729D",
  "audio/G729E",
  "audio/GSM",
  "audio/GSM-EFR",
  "audio/GSM-HR-08",
  "audio/iLBC",
  "audio/ip-mr_v2.5",
  "audio/L16",
  "audio/L20",
  "audio/L24",
  "audio/L8",
  "audio/LPC",
  "audio/mobile-xmf",
  "audio/mp4",
  "audio/MP4A-LATM",
  "audio/MPA",
  "audio/mpa-robust",
  "audio/mpeg",
  "audio/mpeg4-generic",
  "audio/ogg",
  "audio/opus",
  "audio/parityfec",
  "audio/PCMA",
  "audio/PCMA-WB",
  "audio/PCMU",
  "audio/PCMU-WB",
  "audio/prs.sid",
  "audio/QCELP",
  "audio/raptorfec",
  "audio/RED",
  "audio/rtp-enc-aescm128",
  "audio/rtp-midi",
  "audio/rtploopback",
  "audio/rtx",
  "audio/SMV",
  "audio/SMV-QCP",
  "audio/SMV0",
  "audio/sp-midi",
  "audio/speex",
  "audio/t140c",
  "audio/t38",
  "audio/telephone-event",
  "audio/tone",
  "audio/UEMCLIP",
  "audio/ulpfec",
  "audio/VDVI",
  "audio/VMR-WB",
  "audio/vnd.3gpp.iufp",
  "audio/vnd.4SB",
  "audio/vnd.audiokoz",
  "audio/vnd.CELP",
  "audio/vnd.cisco.nse",
  "audio/vnd.cmles.radio-events",
  "audio/vnd.cns.anp1",
  "audio/vnd.cns.inf1",
  "audio/vnd.dece.audio",
  "audio/vnd.digital-winds",
  "audio/vnd.dlna.adts",
  "audio/vnd.dolby.heaac.1",
  "audio/vnd.dolby.heaac.2",
  "audio/vnd.dolby.mlp",
  "audio/vnd.dolby.mps",
  "audio/vnd.dolby.pl2",
  "audio/vnd.dolby.pl2x",
  "audio/vnd.dolby.pl2z",
  "audio/vnd.dolby.pulse.1",
  "audio/vnd.dra",
  "audio/vnd.dts",
  "audio/vnd.dts.hd",
  "audio/vnd.dvb.file",
  "audio/vnd.everad.plj",
  "audio/vnd.hns.audio",
  "audio/vnd.lucent.voice",
  "audio/vnd.ms-playready.media.pya",
  "audio/vnd.nokia.mobile-xmf",
  "audio/vnd.nortel.vbk",
  "audio/vnd.nuera.ecelp4800",
  "audio/vnd.nuera.ecelp7470",
  "audio/vnd.nuera.ecelp9600",
  "audio/vnd.octel.sbc",
  "audio/vnd.qcelp - DEPRECATED in favor of audio/qcelp",
  "audio/vnd.rhetorex.32kadpcm",
  "audio/vnd.rip",
  "audio/vnd.sealedmedia.softseal.mpeg",
  "audio/vnd.vmx.cvsd",
  "audio/vorbis",
  "audio/vorbis-config",
]

const videoMimeTypes = [
  "application/vnd.apple.mpegurl",
  "application/x-mpegurl",
  "video/1d-interleaved-parityfec",
  "video/3gpp",
  "video/3gpp-tt",
  "video/3gpp2",
  "video/BMPEG",
  "video/BT656",
  "video/CelB",
  "video/DV",
  "video/encaprtp",
  "video/example",
  "video/H261",
  "video/H263",
  "video/H263-1998",
  "video/H263-2000",
  "video/H264",
  "video/H264-RCDO",
  "video/H264-SVC",
  "video/iso.segment",
  "video/JPEG",
  "video/jpeg2000",
  "video/mj2",
  "video/MP1S",
  "video/MP2P",
  "video/MP2T",
  "video/mp4",
  "video/MP4V-ES",
  "video/mpeg",
  "video/mpeg4-generic",
  "video/MPV",
  "video/nv",
  "video/ogg",
  "video/parityfec",
  "video/pointer",
  "video/quicktime",
  "video/raptorfec",
  "video/raw",
  "video/rtp-enc-aescm128",
  "video/rtploopback",
  "video/rtx",
  "video/SMPTE292M",
  "video/ulpfec",
  "video/vc1",
  "video/vnd.CCTV",
  "video/vnd.dece.hd",
  "video/vnd.dece.mobile",
  "video/vnd.dece.mp4",
  "video/vnd.dece.pd",
  "video/vnd.dece.sd",
  "video/vnd.dece.video",
  "video/vnd.directv.mpeg",
  "video/vnd.directv.mpeg-tts",
  "video/vnd.dlna.mpeg-tts",
  "video/vnd.dvb.file",
  "video/vnd.fvt",
  "video/vnd.hns.video",
  "video/vnd.iptvforum.1dparityfec-1010",
  "video/vnd.iptvforum.1dparityfec-2005",
  "video/vnd.iptvforum.2dparityfec-1010",
  "video/vnd.iptvforum.2dparityfec-2005",
  "video/vnd.iptvforum.ttsavc",
  "video/vnd.iptvforum.ttsmpeg2",
  "video/vnd.motorola.video",
  "video/vnd.motorola.videop",
  "video/vnd.mpegurl",
  "video/vnd.ms-playready.media.pyv",
  "video/vnd.nokia.interleaved-multimedia",
  "video/vnd.nokia.videovoip",
  "video/vnd.objectvideo",
  "video/vnd.radgamettools.bink",
  "video/vnd.radgamettools.smacker",
  "video/vnd.sealed.mpeg1",
  "video/vnd.sealed.mpeg4",
  "video/vnd.sealed.swf",
  "video/vnd.sealedmedia.softseal.mov",
  "video/vnd.uvvu.mp4",
  "video/vnd.vivo",
]

const allowedMimeTypes = [...imageMimeTypes, ...audioMimeTypes, ...videoMimeTypes]

export type AttachmentSelectedStatus = "picked" | "error" | "uploading" | "uploaded" | "sending"

export const isImageMimetype = (mimeType: Nullable<string>) =>
  !!mimeType && imageMimeTypes.includes(mimeType.toLowerCase())
export const isAudioMimeType = (mimeType: Nullable<string>) =>
  !!mimeType && audioMimeTypes.includes(mimeType.toLowerCase())
export const isVideoMimeType = (mimeType: Nullable<string>) =>
  !!mimeType && videoMimeTypes.includes(mimeType.toLowerCase())
export const isAllowedMimeType = (mimeType: Nullable<string>) =>
  !!mimeType && allowedMimeTypes.includes(mimeType.toLowerCase())

export const getImageSize = (imageURI: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    Image.getSize(
      imageURI,
      (width, height) => {
        resolve({ width, height })
      },
      (error: any) => {
        reject(error)
      },
    )
  })

const calculateImageOptiSize = (
  imageSize: {
    width: number
    height: number
  },
  avatar?: boolean,
) => {
  const maxBig = avatar ? 400 : 1600
  const maxSmall = avatar ? 400 : 1200
  const isPortrait = imageSize.height > imageSize.width
  const biggestValue = new Big(isPortrait ? imageSize.height : imageSize.width)
  const smallestValue = new Big(isPortrait ? imageSize.width : imageSize.height)
  const ratio1 = biggestValue.gt(maxBig) ? biggestValue.div(maxBig) : new Big(1)
  const ratio2 = smallestValue.gt(maxSmall) ? smallestValue.div(maxSmall) : new Big(1)
  const ratio = ratio1.gt(ratio2) ? ratio1 : ratio2

  const newBiggestValue = biggestValue.div(ratio)
  const newSmallestValue = smallestValue.div(ratio)

  const big = newBiggestValue.toNumber()
  const small = newSmallestValue.toNumber()

  return {
    width: isPortrait ? small : big,
    height: isPortrait ? big : small,
  }
}

export const compressAndResizeImage = async (imageURI: string, avatar?: boolean) => {
  const imageSize = await getImageSize(imageURI)
  const newSize = calculateImageOptiSize(imageSize, avatar)

  logger.debug(
    `Resizing and compressing image to ${newSize.height}x${newSize.width} (was ${imageSize.height}x${imageSize.width})`,
  )

  const context = ImageManipulator.manipulate(imageURI)
  context.resize(newSize)
  const image = await context.renderAsync()
  const result = await image.saveAsync({
    base64: false,
    compress: avatar ? 0.6 : 0.3,
    format: SaveFormat.JPEG,
  })

  return result
}

export const pickSingleMediaFromLibrary = async (
  options?: Omit<ImagePicker.ImagePickerOptions, "allowsMultipleSelection">,
) => {
  const mediaPicked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
    base64: false,
    allowsMultipleSelection: false,
    ...options,
  })

  if (mediaPicked.canceled) {
    return
  }

  const asset = mediaPicked.assets?.[0]

  if (!asset) {
    return
  }

  return asset
}

export async function pickMultipleMediaFromLibrary(
  options?: Omit<ImagePicker.ImagePickerOptions, "allowsMultipleSelection">,
) {
  const mediaPicked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    quality: 1,
    base64: false,
    ...options,
  })

  if (mediaPicked.canceled) {
    return
  }

  return mediaPicked.assets
}

export const takePictureFromCamera = async (
  options?: ImagePicker.ImagePickerOptions | undefined,
) => {
  let cameraPermissions = await ImagePicker.getCameraPermissionsAsync()
  if (!cameraPermissions?.granted && cameraPermissions?.canAskAgain) {
    cameraPermissions = await ImagePicker.requestCameraPermissionsAsync()
  }
  if (!cameraPermissions?.granted) {
    Alert.alert("You need to grant Convos access to the camera before proceeding", undefined, [
      {
        text: "Settings",
        isPreferred: true,
        onPress: () => {
          Linking.openSettings()
        },
      },
      { text: "Close" },
    ])
    return
  }

  const mediaPicked = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 1,
    base64: false,
    allowsEditing: false,
    ...options,
  })
  if (mediaPicked.canceled) return
  const asset = mediaPicked.assets?.[0]
  if (!asset) return
  return asset
}

export function getMimeTypeFromAsset(asset: ImagePicker.ImagePickerAsset) {
  let mimeType = asset.mimeType
  if (!mimeType) {
    const match = asset.uri.match(/data:(.*?);/)
    if (match && match[1]) {
      mimeType = match[1]
    }
  }
  return mimeType ?? null
}
