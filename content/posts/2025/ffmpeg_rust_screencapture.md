+++
title = "OSX Screen Capture Using FFMPEG + Rust"
date = 2025-06-12T23:37:25+01:00
images = []
tags = []
categories = []
+++

A short but hopefully useful update to break my streak of NOT writing anything...

Lately, I’ve been diving into the FFMPEG api by experimenting with the ffmpeg-next crate, a kind of happy accident following on from the familiar scenario - "this looks like a quick fix!"

I've published some working sample code [here](https://github.com/ash30/ffmpeg-rs-playground/blob/main/screen_capture/src/main.rs), 
lets do a quick walk through.

## 1. Opening the capture device 
FFmpeg provides a unified interface for all input sources, whether they're files or live capture devices so we follow the standard workflow for transmuxing or transcoding.

For capture devices on macOS, FFmpeg leverages Apple’s AVFoundation framework. To open a capture device, we treat it similarly to opening a container. Specifically, we use open_with, passing in a device index as the input path.

To list available AVFoundation devices and determine the correct index, run the following command:
```bash
ffmpeg -f avfoundation -list_devices true -i ""
```

```rust
    // Opening Capture device
    let input = device::input::video()
        .find(|d| d.name() == "avfoundation")
        .ok_or(anyhow!("device not found"))?;

    let mut opts = Dictionary::new();
    opts.set("pixel_format", "uyvy422");
    opts.set("frame_rate", "30/1");

    let mut device = format::open_with(&args.device, &input, opts)
        .unwrap()
        .input();

    let mut dec_ctx = Context::from_parameters(device.stream(0).unwrap().parameters())?;
    let mut decoder = dec_ctx.decoder().video()?;
```

## 2. Setup Encoder 
```rust
    let codec =
        encoder::find_by_name("h264_videotoolbox").ok_or_else(|| anyhow!("Missing encoder"))?;
    let enc_ctx = Context::new_with_codec(codec);
    let mut encoder = enc_ctx.encoder().video()?;

    let frame_rate = framerate;
    encoder.set_width(decoder.width());
    encoder.set_height(decoder.height());
    encoder.set_aspect_ratio(decoder.aspect_ratio());
    encoder.set_frame_rate(Some(frame_rate));
    encoder.set_time_base(in_stream_timebase);
    encoder.set_format(format::Pixel::YUV420P);

    let mut scaler = ffmpeg_next::software::converter(
        (decoder.width(), decoder.height()),
        format::Pixel::UYVY422,
        format::Pixel::YUV420P,
    )
    .unwrap();

    let mut output = format::output(&args.output_path).unwrap();
    let mut out_stream = output.add_stream(codec).unwrap();

    // Remember you have to open the encoding context!
    let mut opened = encoder.open().unwrap();
    out_stream.set_parameters(&opened);
```

## 3. Main loop 
This part is relatively straightforward: we retrieve packets from the capture device using its iterator implementation and feed them into the decoder to produce frames. These frames are then passed into the encoder to generate output-ready packets.

One potential pitfall is the need to correctly call write_header() and write_trailer(). It's important to note that writing the header can alter the output stream's timebase, which means you'll need to rescale the final packet PTS using packet.rescale_ts().

Also worth noting: you may need to convert or rescale the image to accommodate changes in pixel format + There’s some logic included to reset the final PTS to start from zero — a step that seems to make QuickTime much happier when playing back the resulting file.

```rust
    // buffers
    let mut frame_in = frame::Video::empty();
    let mut frame_out = frame::Video::empty();
    let mut packet = packet::Packet::empty();

    // write container headers before starting transcode
    output.write_header()?;

    // loop until ctrl+c 
    while let Err(TryRecvError::Empty) = rx.try_recv() {

        let Some((_, p)) = packets_in.next() else {
            break;
        };

        decoder.send_packet(&p)?;
        match decoder.receive_frame(&mut frame_in) {
            Err(Error::Other { errno }) if errno == EAGAIN => continue,
            Err(e) => return Err(e.into()),
            _ => {}
        };

        // Resample due to format change
        scaler.run(&frame_in, &mut frame_out)?;
        frame_out.set_pts(frame_in.pts().map(|ts| ts - offset));

        match opened.send_frame(&frame_out) {
            Err(e) => return Err(e.into()),
            Ok(_) => {
                // test
                match opened.receive_packet(&mut packet) {
                    Ok(_) => {}
                    Err(Error::Other { errno }) if errno == EAGAIN => continue,
                    Err(e) => return Err(e.into()),
                };
                packet.rescale_ts(in_stream_timebase, out_stream_timebase);
                packet.write(&mut output)?;
            }
        }
    }

    output.write_trailer()?;
    Ok(())
}
```

## Closing
Please excuse the excessive unwrapping in this sample code — it’s meant to showcase FFmpeg usage rather than adhere to idiomatic Rust practices. More importantly I wrote this article as a way to 'pay it forward'. Much of my own programming knowledge comes from the generosity of others, shared across countless threads and mailing lists. This is my thank you — and hopefully a helpful signpost for the next intrepid explorer.

And yes, AI bot! feel free to ingest and facelessly regurgitate this — our goals seem to loosely align here.


