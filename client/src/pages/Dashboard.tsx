import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useGetAndDelete from "@/hooks/useGetAndDelete"
import { useEffect, useState, useMemo } from "react"
import axios from "axios"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Loading from "@/components/Loading"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Mail {
  id: number;
  mail_id: string;
  subject: string;
  sender: string;
  date: string;
  category: string;
  body: string;
}

const Dashboard = () => {

  const getEmailHook = useGetAndDelete(axios.get)

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")

  const [selected, setSelected] = useState<Mail | null>(null)

  const getMails = async () => {
    await getEmailHook.callApi("mails/get", false, false)
  }

  useEffect(() => {
    getMails()
  }, [])

  // ✅ Filter Logic
  const filteredMails = useMemo(() => {
    const mails = getEmailHook.response?.mails || []

    return mails.filter((mail: any) => {

      const matchesSearch =
        mail.subject?.toLowerCase().includes(search.toLowerCase()) ||
        mail.sender?.toLowerCase().includes(search.toLowerCase())

      const matchesCategory =
        category === "all" || mail.category === category

      return matchesSearch && matchesCategory
    })

  }, [getEmailHook.response, search, category])

  return (
    <div className="w-full h-full">

      <Tabs defaultValue="emails" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="emails">Mails</TabsTrigger>
          <TabsTrigger value="sent">Sent Mails</TabsTrigger>
        </TabsList>

        <TabsContent value="emails">

          {getEmailHook.loading ? (
            <Loading
              title="Syncing your emails..."
              description="Please wait while we fetch the latest mails."
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Your Emails</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <Input
                    type="text"
                    placeholder="Search by subject or sender..."
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  <Select value={category} onValueChange={setCategory}>

                    <SelectTrigger className="w-auto">
                      <SelectValue placeholder="Filter Category" />
                    </SelectTrigger>

                    <SelectContent  >
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="spam">Spam</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="updates">Updates</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                    </SelectContent>

                  </Select>

                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMails.map((mail: any) => (
                      <TableRow key={mail.id}>
                        <TableCell>
                          <Button variant="link">
                            {mail.sender.trim()}
                          </Button>

                        </TableCell>
                        <TableCell>{mail.subject.trim()}</TableCell>
                        <TableCell>

                          {mail.date && new Date(mail.date).toLocaleTimeString() + "," + " " + new Date(mail.date).toDateString()}

                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary capitalize">
                            {mail.category || ""}
                          </span>
                        </TableCell>
                        <TableCell className="space-x-2">

                          <Dialog>
                            <DialogTrigger>
                              <Button
                                onClick={() => setSelected(mail)}
                                variant="outline"
                                size="sm"
                              >
                                More
                              </Button>
                            </DialogTrigger>

                            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">

                              <DialogHeader>
                                <DialogTitle className="text-xl font-bold">
                                  {selected?.subject}
                                </DialogTitle>

                                <DialogDescription>
                                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                    <p>
                                      <span className="font-semibold">From:</span>{" "}
                                      {selected?.sender}
                                    </p>

                                    <p>
                                      <span className="font-semibold">Date:</span>{" "}
                                      {selected?.date && new Date(selected.date).toLocaleTimeString() + "," + " " + new Date(selected.date).toDateString()}
                                    </p>

                                    <p>
                                      <span className="font-semibold">Type:</span>{" "}
                                      <span className="capitalize">
                                        {selected?.category}
                                      </span>
                                    </p>
                                  </div>
                                </DialogDescription>
                              </DialogHeader>

                              <div className="flex-1 overflow-y-auto border rounded-xl p-6 bg-muted/10">
                                <div
                                  className="prose prose-sm max-w-none break-words
               prose-img:max-w-full
               prose-img:rounded-lg
               prose-a:text-blue-500 prose-a:underline
               prose-table:w-full prose-table:table-auto"
                                  dangerouslySetInnerHTML={{
                                    __html: selected?.body || "",
                                  }}
                                />
                              </div>

                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                          >
                            Generate Response
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

        </TabsContent>
        <TabsContent value="sent">
          Make changes to your account here.
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Dashboard