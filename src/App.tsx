import { useState, useEffect } from 'react';
import { getServers, addServer, updateServer, importYAML, exportYAML } from './db';
import { Download, Plus, Search, Upload, Edit, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

interface Server {
  id?: number;
  serverName: string;
  standort: string;
  dmz: string;
  verfuegbarkeit: string;
  schutzbedarf: string;
  artDerUmgebung: string;
  fqdnProd: string;
  fqdnAdmin: string;
  ipProd: string;
  ipAdmin: string;
  betriebssystem: string;
  dbms: string;
  dbmsEdition: string;
  majorRelease: string;
  kunde: string;
  instanzname: string;
  verbindungsart: string;
  sicherungsmethode: string;
  verfahrenZweck: string;
  kommentar: string;
  clustername: string;
  itsmBusinessService: string;
  lebenszyklus: string;
  supportEnde: string;
  anzeigename: string;
  ccUndMem: string;
  service: string;
}

const INITIAL_SERVER: Omit<Server, 'id'> = {
  serverName: '',
  standort: '',
  dmz: '',
  verfuegbarkeit: '',
  schutzbedarf: '',
  artDerUmgebung: '',
  fqdnProd: '',
  fqdnAdmin: '',
  ipProd: '',
  ipAdmin: '',
  betriebssystem: '',
  dbms: '',
  dbmsEdition: '',
  majorRelease: '',
  kunde: '',
  instanzname: '',
  verbindungsart: '',
  sicherungsmethode: '',
  verfahrenZweck: '',
  kommentar: '',
  clustername: '',
  itsmBusinessService: '',
  lebenszyklus: '',
  supportEnde: '',
  anzeigename: '',
  ccUndMem: '',
  service: ''
};

// Only show the most important columns in the main view
const VISIBLE_COLUMNS = [
  { key: 'serverName', label: 'Server' },
  { key: 'standort', label: 'Standort' },
  { key: 'kunde', label: 'Kunde' },
  { key: 'betriebssystem', label: 'Betriebssystem' },
  { key: 'dbms', label: 'DBMS' },
  { key: 'service', label: 'Service' }
];

const ALL_COLUMNS = [
  { key: 'serverName', label: 'Server' },
  { key: 'standort', label: 'Standort' },
  { key: 'dmz', label: 'DMZ' },
  { key: 'verfuegbarkeit', label: 'Verfügbarkeit' },
  { key: 'schutzbedarf', label: 'Schutzbedarf' },
  { key: 'artDerUmgebung', label: 'Art der Umgebung' },
  { key: 'fqdnProd', label: 'FQDN (Prod)' },
  { key: 'fqdnAdmin', label: 'FQDN (Admin)' },
  { key: 'ipProd', label: 'IP (Prod)' },
  { key: 'ipAdmin', label: 'IP (Admin)' },
  { key: 'betriebssystem', label: 'Betriebssystem' },
  { key: 'dbms', label: 'DBMS' },
  { key: 'dbmsEdition', label: 'DBMS Edition' },
  { key: 'majorRelease', label: 'Major Release' },
  { key: 'kunde', label: 'Kunde' },
  { key: 'instanzname', label: 'Instanzname' },
  { key: 'verbindungsart', label: 'Verbindungsart' },
  { key: 'sicherungsmethode', label: 'Sicherungsmethode' },
  { key: 'verfahrenZweck', label: 'Verfahren / Zweck' },
  { key: 'kommentar', label: 'Kommentar' },
  { key: 'clustername', label: 'Clustername' },
  { key: 'itsmBusinessService', label: 'ITSM Business Service' },
  { key: 'lebenszyklus', label: 'Lebenszyklus' },
  { key: 'supportEnde', label: 'Support Ende' },
  { key: 'anzeigename', label: 'Anzeigename' },
  { key: 'ccUndMem', label: 'CC und MEM' },
  { key: 'service', label: 'Service' }
];

function ServerForm({ 
  data, 
  onSubmit, 
  onClose 
}: { 
  data: Partial<Server>; 
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {ALL_COLUMNS.map(col => (
          <div key={col.key} className="space-y-2">
            <Label htmlFor={col.key}>{col.label}</Label>
            <Input
              id={col.key}
              type="text"
              value={data[col.key as keyof Server] || ''}
              onChange={(e) => data.onChange?.({ ...data, [col.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Abbrechen
        </Button>
        <Button type="submit">
          {data.id ? 'Aktualisieren' : 'Hinzufügen'}
        </Button>
      </div>
    </form>
  );
}

function App() {
  const [servers, setServers] = useState<Server[]>([]);
  const [newServer, setNewServer] = useState<Omit<Server, 'id'>>(INITIAL_SERVER);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>(
    Object.fromEntries(VISIBLE_COLUMNS.map(col => [col.key, '']))
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    const fetchedServers = await getServers();
    setServers(fetchedServers);
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newServer.serverName.trim()) {
      await addServer(newServer);
      await fetchServers();
      setNewServer(INITIAL_SERVER);
      setShowAddDialog(false);
    }
  };

  const handleUpdateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingServer && editingServer.serverName.trim()) {
      await updateServer(editingServer);
      await fetchServers();
      setEditingServer(null);
      setShowEditDialog(false);
    }
  };

  const filteredServers = servers.filter((server) => {
    const matchesSearch = searchQuery === '' || 
      Object.values(server).some(value => 
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesFilters = VISIBLE_COLUMNS.every(col => 
      filters[col.key] === '' ||
      String(server[col.key as keyof Server])
        .toLowerCase()
        .includes(filters[col.key].toLowerCase())
    );

    return matchesSearch && matchesFilters;
  });

  const handleYAMLUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const yamlData = event.target?.result as string;
        await importYAML(yamlData);
        await fetchServers();
      };
      reader.readAsText(file);
    }
  };

  const handleExportYAML = async () => {
    const yamlContent = await exportYAML();
    const blob = new Blob([yamlContent], { type: 'application/x-yaml;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'servers.yaml');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Serverübersicht MxSQL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Server suchen..."
                  className="w-full"
                />
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Server hinzufügen
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Neuen Server hinzufügen</DialogTitle>
                  </DialogHeader>
                  <ServerForm 
                    data={newServer} 
                    onSubmit={handleAddServer}
                    onClose={() => setShowAddDialog(false)}
                  />
                </DialogContent>
              </Dialog>
              <label className="cursor-pointer">
                <Button variant="secondary" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    YAML importieren
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".yaml,.yml"
                  onChange={handleYAMLUpload}
                  className="hidden"
                />
              </label>
              <Button variant="secondary" onClick={handleExportYAML}>
                <Download className="mr-2 h-4 w-4" />
                YAML exportieren
              </Button>
            </div>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Server bearbeiten</DialogTitle>
                </DialogHeader>
                {editingServer && (
                  <ServerForm 
                    data={editingServer} 
                    onSubmit={handleUpdateServer}
                    onClose={() => setShowEditDialog(false)}
                  />
                )}
              </DialogContent>
            </Dialog>

            <ScrollArea className="h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {VISIBLE_COLUMNS.map(col => (
                      <TableHead key={col.key}>
                        <div className="space-y-2">
                          <div>{col.label}</div>
                          <Input
                            type="text"
                            value={filters[col.key]}
                            onChange={(e) => setFilters({ ...filters, [col.key]: e.target.value })}
                            placeholder="Filtern"
                            className="w-full"
                          />
                        </div>
                      </TableHead>
                    ))}
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServers.map((server) => (
                    <TableRow key={server.id}>
                      {VISIBLE_COLUMNS.map(col => (
                        <TableCell key={col.key}>
                          {server[col.key as keyof Server]}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingServer(server);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;