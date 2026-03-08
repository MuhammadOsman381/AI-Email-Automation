import { useState } from "react"
import {
  Editor,
  EditorProvider,
  Toolbar,
  BtnBold,
  BtnItalic,
  BtnUnderline,
  createButton,
  BtnLink
} from "react-simple-wysiwyg"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from "@/components/ui/card"
import usePostAndPut from "@/hooks/usePostAndPut"
import axios from "axios"


const BtnAlignCenter = createButton('Align center', '≡', 'justifyCenter');


export default function ComposeEmail() {
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [file, setFile] = useState<File | null | undefined>(null)

  const mailComposeHook = usePostAndPut(axios.post)

  const handleSubmit = async () => {
    console.log({
      to,
      subject,
      body,
      file
    })

    if (to === "" || subject === "" || body === "") {
      return
    }

    const formData = new FormData()
    formData.append("to", to)
    formData.append("subject", subject)
    formData.append("body", body)
    file && formData.append("file", file)
    const response = await mailComposeHook.callApi("mails/compose", formData, false, true, true);
    console.log(response)
  }

  return (
    <div className="w-full  mx-auto ">

      <Card>

        <CardHeader>
          <CardTitle>Compose</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          <Input
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />

          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          {/* Editor */}
          <div className="rounded-md overflow-hidden">

            <EditorProvider>
              <div className=" bg-transparent rounded-xl p-0.5">
                <Editor
                  containerProps={{ style: { border: '1px solid #3F3F46', backgroundColor: '#222225', borderRadius: '10px' } }}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-[200px] p-3  "
                >
                  <Toolbar className="bg-zinc-500 border-b flex">
                    <BtnBold />
                    <BtnItalic />
                    <BtnUnderline />
                    <BtnLink />
                    <BtnAlignCenter />
                  </Toolbar>

                </Editor>
              </div>
            </EditorProvider>

          </div>


          <Input
            type="file"
            onChange={(e) => setFile(e?.target?.files?.[0])}
          />

        </CardContent>

        <CardFooter>
          <Button onClick={handleSubmit} className="w-full">
            Send Email
          </Button>
        </CardFooter>

      </Card>

    </div>
  )
}