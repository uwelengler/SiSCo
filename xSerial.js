
		var port;
		var reader;
		var decoder;
	    var SerialPortInfo = {
			
		  };
		async function connect(linecallback) {
			
			
			let xports = await navigator.serial.getPorts();
			console.log(xports);
			
			const filters = [
				{ usbVendorId: 6790, usbProductId: 29987 },
				{ usbVendorId: 0x2341, usbProductId: 0x0043 },
				{ usbVendorId: 0x2341, usbProductId: 0x0001 }
			  ];
			port = await navigator.serial.requestPort({ filters });
			const { usbProductId, usbVendorId } = port.getInfo();

			//console.log(usbProductId, usbVendorId)
			//let ports = await navigator.serial.getPorts();
			try {
			await port.open({ baudRate: 9600 });
			} catch (error) {
			console.log("erroropen");
			console.log(error)
		  	} 		  
			decoder = new TextDecoderStream();
			inputDone = port.readable.pipeTo(decoder.writable);
			inputStream = decoder.readable;
			const encoder = new TextEncoderStream();
			outputDone = encoder.readable.pipeTo(port.writable);
			outputStream = encoder.writable;
			reader = inputStream.getReader();
			//closed = readUntilClosed(linecallback);
			readloop(linecallback)
		}
		function writetostream(line) {
			const writer = outputStream.getWriter();
			console.log(line)
			writer.write(line + '\n');
			writer.releaseLock();
		}
		
        async function disconnectPort () {
			console.log('disconnect');
			//location.reload();
			// irgendein ein Rest bleibt immer, daher als workaround ein reload
			// ab hier wird nix ausgeführt
			if (reader ) {
				try{
					await reader.releaseLock();
					await inputStream.cancel(); // da war wichtig
				 
			    } catch (error) {
				console.log("errorcancel");
				console.log(error)
				  } 	
				await inputDone.catch(() => {});
            	reader = null;
            	inputDone = null;
			}
			if (outputStream) {
				await outputStream.getWriter().close();
				await outputDone.catch(() => {}); 
				outputStream = null;
				outputDone = null;
			}
           await port.close() 
		   port=null
		   
        }
		
		async function readloop(linecallback) {
			xstart=false
			buffer=""
            while (port.readable) {
				//reader = port.readable.getReader();
            try {
              while (true) {
                const { value, done } = await reader.read();
                if (value) {
					console.log(value)
					
						buffer=buffer+value
						//console.log(buffer)
						const lines = buffer.split('\r\n');
                        //console.log(lines)
                        if (lines.length > 1)
						{lines.forEach(xelement => {
                            linecallback(xelement)
							buffer=xelement					
					    })}
				
				}
				if (done) {
					console.log('[readLoop] DONE', done);
					await reader.releaseLock();
					break;
				}
               
              }
            } catch (error) {
				console.log('[readLoop] error');
				await reader.releaseLock()
                break;
            } finally {
				console.log('[readLoop] finally');
              //reader.cancel();
            }
          }
        }
